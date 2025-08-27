import { z } from 'zod'
import { type Conversation, type ContextWithMetadata, type ToolOutput, type UIUCTool } from '@/types/chat'
import { fetchContextsFromBackend } from '~/pages/api/getContexts'
import { fetchImageDescription } from '~/pages/api/UIUC-api/fetchImageDescription'
import { callN8nFunction } from '~/utils/functionCalling/handleFunctionCalling'

export type BuiltTool = {
  name: string
  description: string
  parameters: any
  execute: (args: any) => Promise<any>
}

export function buildImageDescriptionTool({
  conversation,
  courseName,
  llmProviders,
}: {
  conversation: Conversation
  courseName: string
  llmProviders: any
}): BuiltTool {
  return {
    name: 'describe_images',
    description:
      'Describe provided image URLs in context of the user query. Use only when there are images or you truly need to infer visual details.',
    parameters: z.object({
      imageUrls: z.array(z.string()).min(1),
      userQuery: z.string().optional(),
    }),
    async execute(args: { imageUrls: string[]; userQuery?: string }) {
      // Inject images into the last user message for reusing existing pipeline
      const lastMsg = conversation.messages[conversation.messages.length - 1]
      if (lastMsg && Array.isArray(lastMsg.content)) {
        // append image urls as content for the helper API to use
        args.imageUrls.forEach((url) => {
          ;(lastMsg.content as any[]).push({ type: 'image_url', image_url: { url } })
        })
      }

      const controller = new AbortController()
      const desc = await fetchImageDescription(
        courseName,
        conversation,
        llmProviders,
        controller,
      )
      return { text: desc }
    },
  }
}

export function buildRetrievalTool({
  courseName,
}: {
  courseName: string
}): BuiltTool {
  return {
    name: 'retrieve_documents',
    description:
      'Retrieve potentially relevant course documents for grounding and citations.',
    parameters: z.object({
      query: z.string(),
      documentGroups: z.array(z.string()).optional(),
      tokenLimit: z.number().optional(),
    }),
    async execute(args: {
      query: string
      documentGroups?: string[]
      tokenLimit?: number
    }): Promise<{ contexts: ContextWithMetadata[] }> {
      const contexts = await fetchContextsFromBackend(
        courseName,
        args.query,
        args.tokenLimit ?? 4000,
        args.documentGroups ?? [],
      )
      return { contexts }
    },
  }
}

export function buildN8nToolsFromWorkflows({
  workflows,
  courseName,
}: {
  workflows: UIUCTool[]
  courseName: string
}): BuiltTool[] {
  return workflows.map((wf) => {
    const schema = z.object(
      Object.entries(wf.inputParameters?.properties || {}).reduce(
        (acc, [key, param]) => {
          const type = (param as any).type
          if (type === 'number') acc[key] = z.number()
          else if (type === 'Boolean') acc[key] = z.boolean()
          else acc[key] = z.string()
          return acc
        },
        {} as Record<string, z.ZodTypeAny>,
      ),
    )

    return {
      name: wf.name,
      description: wf.description,
      parameters: schema,
      async execute(args: Record<string, any>): Promise<ToolOutput> {
        const toolLike = {
          ...wf,
          aiGeneratedArgumentValues: args as Record<string, string>,
        }
        const output = await callN8nFunction(toolLike, courseName, undefined)
        return output
      },
    }
  })
}

