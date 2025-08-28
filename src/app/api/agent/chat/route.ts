import { type NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, type CoreMessage } from 'ai'
import { z } from 'zod'
import { buildImageDescriptionTool, buildN8nToolsFromWorkflows, buildRetrievalTool } from '~/utils/agent/tools'
import { type ChatBody, type Conversation, type Message, type UIUCTool } from '@/types/chat'
import { convertConversationToCoreMessagesWithoutSystem } from '~/utils/apiUtils'
import { determineAndValidateModel } from '~/utils/streamProcessing'
import { fetchTools } from '~/utils/functionCalling/handleFunctionCalling'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { AnthropicModelID } from '~/utils/modelProviders/types/anthropic'
import { GeminiModelID } from '~/utils/modelProviders/types/gemini'
import { BedrockModelID } from '~/utils/modelProviders/types/bedrock'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

function getAgentSystemPrompt(defaultPrompt: string): string {
  return [
    defaultPrompt,
    '',
    'Agent Capabilities:',
    'You can call tools multiple times (sequentially or in parallel) to gather facts, retrieve course documents for citations, describe images, and run workflows. Use tools as needed, then produce a final answer. Do not include intermediate tool I/O in your final answer; that will be shown separately in the UI.',
    '',
    'Citations:',
    'Always place citations using <cite>N</cite> format (or <cite>1, 2</cite> for multiple), at the end of complete thoughts where relevant. Do not include raw URLs in the body; use citations only.',
    '',
    'Style:',
    'Follow the existing formatting and markdown rules. Keep answers concise, structured, and accurate.',
    '',
    'Constraints:',
    'Avoid excessive looping. Maximum of 8 tool steps. Think stepwise but be concise.',
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

    const { activeModel, modelsWithProviders } = await determineAndValidateModel(
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

    // Prepare model client for supported providers (OpenAI, Anthropic, Google)
    let model: any
    if ((Object.values(OpenAIModelID) as string[]).includes(activeModel.id)) {
      let apiKey = (llmProviders?.OpenAI?.apiKey as string) || (process.env.VLADS_OPENAI_KEY as string)
      if (!apiKey) {
        return new Response(
          `event: tool\ndata: ${JSON.stringify({ type: 'tool-error', name: 'agent', error: 'No OpenAI API key configured for agent.' })}\n\n`,
          { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } },
        )
      }
      apiKey = await decryptKeyIfNeeded(apiKey)
      const openAIClient = createOpenAI({ apiKey, baseURL: 'https://api.openai.com/v1', compatibility: 'strict' })
      model = openAIClient(activeModel.id)
    } else if ((Object.values(AnthropicModelID) as string[]).includes(activeModel.id)) {
      let apiKey = (llmProviders?.Anthropic?.apiKey as string) || (process.env.ANTHROPIC_API_KEY as string)
      if (!apiKey) {
        return new Response(
          `event: tool\ndata: ${JSON.stringify({ type: 'tool-error', name: 'agent', error: 'No Anthropic API key configured for agent.' })}\n\n`,
          { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } },
        )
      }
      apiKey = await decryptKeyIfNeeded(apiKey)
      const anthropic = createAnthropic({ apiKey })
      model = anthropic(activeModel.id)
    } else if ((Object.values(GeminiModelID) as string[]).includes(activeModel.id)) {
      let apiKey = (llmProviders?.Gemini?.apiKey as string) || (process.env.GOOGLE_GENERATIVE_AI_API_KEY as string)
      if (!apiKey) {
        return new Response(
          `event: tool\ndata: ${JSON.stringify({ type: 'tool-error', name: 'agent', error: 'No Google API key configured for agent.' })}\n\n`,
          { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } },
        )
      }
      apiKey = await decryptKeyIfNeeded(apiKey)
      const google = createGoogleGenerativeAI({ apiKey })
      model = google(activeModel.id)
    } else if ((Object.values(BedrockModelID) as string[]).includes(activeModel.id)) {
      // Bedrock via AI SDK (requires AWS credentials in env)
      const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
      const bedrock = createAmazonBedrock({ region })
      model = bedrock(activeModel.id)
    } else {
      return new Response(
        `event: tool\ndata: ${JSON.stringify({ type: 'tool-error', name: 'agent', error: `Model '${activeModel.id}' is not supported by Agent tools yet.` })}\n\n`,
        { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } },
      )
    }

    const defaultSystem = process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT || ''
    const systemPrompt = getAgentSystemPrompt(defaultSystem)
    const coreMessages: CoreMessage[] = convertConversationToCoreMessagesWithoutSystem(
      conversation as Conversation,
    ) as CoreMessage[]

    // Create a TransformStream to multiplex tool events and final text (AWS-friendly SSE)
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

    // Stream plain JSON SSE for message tokens (no Vercel channel lines)
    ;(async () => {
      try {
        const encoder = new TextEncoder()
        for await (const delta of result.textStream) {
          const frame = `event: message\ndata: ${JSON.stringify({ type: 'text', text: delta })}\n\n`
          await writer.write(encoder.encode(frame))
        }
      } catch (e) {
        const encoder = new TextEncoder()
        await writer.write(encoder.encode(encodeSSEEvent({ type: 'tool-error', name: 'agent', error: (e as Error).message })))
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

