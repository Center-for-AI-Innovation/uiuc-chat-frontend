import { type NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, type CoreMessage } from 'ai'
import { z } from 'zod'
import { buildImageDescriptionTool, buildN8nToolsFromWorkflows, buildRetrievalTool } from '~/utils/agent/tools'
import { type ChatBody, type Conversation, type Message, type UIUCTool } from '@/types/chat'
import { convertConversationToCoreMessagesWithoutSystem } from '~/utils/apiUtils'
import { determineAndValidateModel } from '~/utils/streamProcessing'
import { fetchTools } from '~/utils/functionCalling/handleFunctionCalling'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

function getAgentSystemPrompt(): string {
  return [
    'You are an autonomous research and execution agent. You can call tools multiple times (sequentially or in parallel) to gather facts, retrieve course documents for citations, describe images, and run workflows. Use tools as needed, then produce a final answer. Do not include intermediate tool I/O in your final answer; that will be shown separately in the UI.',
    'Guidelines:',
    '- Prefer retrieval for course-grounded answers; cite sources using <cite>...> pattern in the final response when relevant.',
    '- Use image description only if the user supplied images or when absolutely necessary.',
    '- Use workflows (n8n tools) to perform actions or structured tasks. Return concise summaries of results.',
    '- Avoid loops: maximum of 8 tool steps. Think stepwise but be concise.',
  ].join('\n')
}

type ToolEvent =
  | { type: 'tool-start'; name: string; args?: any }
  | { type: 'tool-end'; name: string; output?: any }
  | { type: 'tool-error'; name: string; error: string }

function encodeSSEEvent(event: ToolEvent): string {
  return `event: tool\ndata: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatBody & {
      enabledDocumentGroups?: string[]
      enabledTools?: UIUCTool[]
    }

    const { conversation, course_name, llmProviders } = body
    if (!conversation || !conversation.model?.id) {
      return new Response(
        JSON.stringify({ error: 'Missing conversation or model' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { activeModel } = await determineAndValidateModel(
      conversation.model.id,
      course_name,
    )

    // Build tools
    let workflows: UIUCTool[] = body.enabledTools || []
    if (workflows.length === 0) {
      try {
        workflows = (await fetchTools(course_name, '' as any, 20, 'true', false)) as any
      } catch (e) {
        workflows = []
      }
    }

    const imageTool = buildImageDescriptionTool({
      conversation: conversation as Conversation,
      courseName: course_name,
      llmProviders,
    })
    const retrievalTool = buildRetrievalTool({ courseName: course_name })
    const n8nTools = buildN8nToolsFromWorkflows({
      workflows: workflows.filter((t) => t.enabled),
      courseName: course_name,
    })

    const allTools = [imageTool, retrievalTool, ...n8nTools]

    // Map tools to AI SDK tool definitions
    const aiTools: Record<string, { description: string; parameters: any; execute: (args: any) => Promise<any> }> = {}
    for (const tool of allTools) {
      const schema = tool.parameters
      const parameters = z.any().catch(schema).or(schema) // ensure zod
      aiTools[tool.name] = {
        description: tool.description,
        parameters: schema,
        async execute(args: any) {
          return await tool.execute(args)
        },
      }
    }

    // Prepare model client
    const openAIClient = createOpenAI({
      apiKey: (llmProviders?.OpenAI?.apiKey as string) || process.env.VLADS_OPENAI_KEY!,
      baseURL: 'https://api.openai.com/v1',
      compatibility: 'strict',
    })
    const model = openAIClient(activeModel.id)

    const systemPrompt = getAgentSystemPrompt()
    const coreMessages: CoreMessage[] = convertConversationToCoreMessagesWithoutSystem(
      conversation as Conversation,
    ) as CoreMessage[]

    // Create a TransformStream to multiplex tool events and final text
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Kick off AI SDK streaming
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: coreMessages,
      tools: aiTools as any,
      maxSteps: 8,
      onToolCall: async ({ toolName, args }: { toolName: string; args: any }) => {
        await writer.write(new TextEncoder().encode(encodeSSEEvent({ type: 'tool-start', name: toolName, args })))
      },
      onToolResult: async ({ toolName, result }: { toolName: string; result: any }) => {
        await writer.write(new TextEncoder().encode(encodeSSEEvent({ type: 'tool-end', name: toolName, output: result })))
      },
      onError: async (e: unknown) => {
        await writer.write(
          new TextEncoder().encode(
            encodeSSEEvent({ type: 'tool-error', name: 'agent', error: (e as Error).message }),
          ),
        )
      },
    } as any)

    // Pipe the AI SDK data stream (SSE with data: {...})
    const dataResponse = result.toDataStreamResponse()
    const reader = (dataResponse as Response).body!.getReader()

    ;(async () => {
      const encoder = new TextEncoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
      } finally {
        await writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Agent route error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

