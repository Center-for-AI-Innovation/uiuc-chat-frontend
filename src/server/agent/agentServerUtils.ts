// src/server/agent/agentServerUtils.ts
// Server-side utilities for agent mode - direct function calls instead of API requests

import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources/chat/completions'
import {
  type Conversation,
  type UIUCTool,
  type ContextWithMetadata,
  type ToolOutput,
} from '~/types/chat'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import fetchContextsFromBackend from '~/pages/util/fetchContexts'
import { generatePresignedUrl } from '~/pages/api/download'
import {
  getOpenAIToolFromUIUCTool,
  getUIUCToolFromSim,
} from '~/utils/functionCalling/handleFunctionCalling'
import { conversationToMessages as baseConversationToMessages } from '~/utils/functionCalling/conversationToMessages'
import { resolveSimCredentials } from '~/utils/simConfig'
import {
  type SimWorkflow,
  type SimWorkflowListItem,
  type SimInputField,
} from '~/types/sim'
import { type SimExecutionResult } from '~/types/sim'

/**
 * Convert conversation to OpenAI message format for agent mode.
 * Extends base conversationToMessages to append ALL retrieved contexts to the last user message.
 * This is CRITICAL for agent mode - the LLM needs to see full contexts to decide next steps.
 */
function conversationToMessagesWithContexts(
  inputData: Conversation,
): ChatCompletionMessageParam[] {
  const messages = baseConversationToMessages(inputData)

  const lastUserMessage = [...inputData.messages].reverse().find((m) => {
    return m?.role === 'user' && Array.isArray(m.contexts) && m.contexts.length
  })

  if (!lastUserMessage?.contexts?.length) return messages

  const targetIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg?.role === 'user' && typeof msg.content === 'string') return i
    }
    return -1
  })()

  if (targetIndex === -1) return messages

  const contextSummary = lastUserMessage.contexts
    .map(
      (ctx, idx) =>
        `[Context ${idx + 1} from "${ctx.readable_filename}" (page ${ctx.pagenumber || 'N/A'})]: ${ctx.text}`,
    )
    .join('\n\n')

  const target = messages[targetIndex]
  if (!target) return messages
  messages[targetIndex] = {
    ...target,
    content: `${target.content}\n\n---\nRetrieved Documents (${lastUserMessage.contexts.length} total):\n${contextSummary}`,
  }

  return messages
}

// Re-export for convenience (imported from handleFunctionCalling)
export { getOpenAIToolFromUIUCTool }

export interface SelectToolsServerParams {
  conversation: Conversation
  availableTools: UIUCTool[]
  openaiKey: string
  imageUrls?: string[]
  imageDescription?: string
  signal?: AbortSignal
}

export interface SelectToolsServerResult {
  selectedTools: UIUCTool[]
  error?: string
}

/**
 * Server-side tool selection using OpenAI function calling.
 * This is the server-side equivalent of calling /api/chat/openaiFunctionCall
 */
export async function selectToolsServer(
  params: SelectToolsServerParams,
): Promise<SelectToolsServerResult> {
  const {
    conversation,
    availableTools,
    openaiKey,
    imageUrls = [],
    imageDescription = '',
    signal,
  } = params

  const lastMessage = conversation.messages[conversation.messages.length - 1]
  if (!lastMessage) {
    return { selectedTools: [], error: 'Conversation missing last message' }
  }

  // Convert UIUCTool to OpenAI compatible format
  const openAITools: ChatCompletionTool[] = getOpenAIToolFromUIUCTool(
    availableTools,
  ) as ChatCompletionTool[]

  // Decrypt the API key
  let decryptedKey = openaiKey
    ? await decryptKeyIfNeeded(openaiKey)
    : process.env.VLADS_OPENAI_KEY

  if (!decryptedKey?.startsWith('sk-')) {
    decryptedKey = process.env.VLADS_OPENAI_KEY as string
  }

  if (!decryptedKey) {
    return {
      selectedTools: [],
      error: 'No OpenAI key available for function calling',
    }
  }

  // Format messages (with contexts appended for agent mode)
  const messagesToSend: ChatCompletionMessageParam[] =
    conversationToMessagesWithContexts(conversation)

  // Add system message
  const globalToolsSystemPromptPrefix =
    "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous. If you have ideas for suitable defaults, suggest that as an option to the user when asking for clarification.\n"
  messagesToSend.unshift({
    role: 'system',
    content: globalToolsSystemPromptPrefix + conversation.prompt,
  })

  // Add image info if present
  if (imageUrls.length > 0 && imageDescription) {
    const imageInfo = `Image URL(s): ${imageUrls.join(', ')};\nImage Description: ${imageDescription}`
    if (messagesToSend.length > 0) {
      const lastMsg = messagesToSend[messagesToSend.length - 1]
      if (lastMsg && typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n${imageInfo}`
      }
    }
  }

  try {
    const requestBody = {
      model: 'gpt-4.1',
      messages: messagesToSend,
      tools: openAITools,
      stream: false,
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return {
        selectedTools: [],
        error: `OpenAI API error: ${response.status}`,
      }
    }

    const data = await response.json()

    if (!data.choices) {
      return { selectedTools: [], error: 'No response from OpenAI' }
    }

    if (!data.choices[0]?.message?.tool_calls) {
      // No tools invoked - this is normal when the AI decides not to use any tools
      return { selectedTools: [] }
    }

    const toolCalls = data.choices[0].message
      .tool_calls as ChatCompletionMessageToolCall[]

    // Map OpenAI tool calls back to UIUCTool format
    const mappedTools = toolCalls.map((openaiTool): UIUCTool | null => {
      const baseTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      )

      if (!baseTool) {
        console.error(
          `Tool ${openaiTool.function.name} not found in available tools.`,
        )
        return null
      }

      return {
        ...baseTool,
        invocationId: openaiTool.id,
        aiGeneratedArgumentValues: JSON.parse(
          openaiTool.function.arguments || '{}',
        ),
      }
    })

    const selectedTools = mappedTools.filter(
      (tool): tool is UIUCTool => tool !== null,
    )

    return { selectedTools }
  } catch (error) {
    console.error('Error in selectToolsServer:', error)
    return {
      selectedTools: [],
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during tool selection',
    }
  }
}

export interface ExecuteToolServerParams {
  tool: UIUCTool
  projectName: string
  simApiKey?: string
  signal?: AbortSignal
}

const SIM_DEFAULT_BASE_URL = 'https://www.sim.ai'
const SIM_TIMEOUT_MS = 300_000

/**
 * Server-side tool execution for Sim AI workflows.
 * Returns the tool with output/error populated.
 */
export async function executeToolServer(
  params: ExecuteToolServerParams,
): Promise<UIUCTool> {
  const { tool, projectName, simApiKey, signal } = params
  const toolCopy = { ...tool }

  const creds = await resolveSimCredentials(projectName, {
    api_key: simApiKey,
  })

  if (!creds.api_key) {
    toolCopy.error = 'Sim API key not available'
    return toolCopy
  }

  const simBaseUrl = (creds.base_url ?? SIM_DEFAULT_BASE_URL).replace(/\/$/, '')
  const url = `${simBaseUrl}/api/workflows/${tool.id}/execute`

  const timeStart = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), SIM_TIMEOUT_MS)

  // Combine external signal with timeout
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const simResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': creds.api_key,
      },
      body: JSON.stringify({
        ...(tool.aiGeneratedArgumentValues ?? {}),
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const secondsToRun = (Date.now() - timeStart) / 1000
    console.debug('Time taken for Sim workflow call:', secondsToRun, 'seconds')

    if (!simResponse.ok) {
      const errText = await simResponse.text()
      let errMessage = `Sim API returned ${simResponse.status}: ${simResponse.statusText}`
      try {
        const errJson = JSON.parse(errText) as { error?: string }
        if (errJson.error) errMessage = errJson.error
      } catch {
        // non-JSON error body
      }
      console.error('[executeToolServer] Sim API error', errMessage)
      toolCopy.error = errMessage
      return toolCopy
    }

    const result = (await simResponse.json()) as SimExecutionResult

    if (!result.success || result.error) {
      toolCopy.error = result.error ?? 'Sim workflow returned success=false'
      return toolCopy
    }

    let toolOutput: ToolOutput
    if (typeof result.output === 'string') {
      toolOutput = { text: result.output }
    } else if (result.output != null) {
      toolOutput = { data: result.output as Record<string, unknown> }
    } else {
      toolOutput = {}
    }

    toolCopy.output = toolOutput
    return toolCopy
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      toolCopy.error = 'Sim workflow timed out after 5 minutes'
      return toolCopy
    }
    console.error(`Error running tool ${tool.readableName}:`, error)
    toolCopy.error =
      error instanceof Error ? error.message : 'Unknown error running tool'
    return toolCopy
  }
}

/**
 * Execute multiple Sim tools in parallel
 */
export async function executeToolsServer(
  tools: UIUCTool[],
  projectName: string,
  simApiKey?: string,
  signal?: AbortSignal,
): Promise<UIUCTool[]> {
  const results = await Promise.all(
    tools.map((tool) =>
      executeToolServer({ tool, projectName, simApiKey, signal }),
    ),
  )
  return results
}

export interface FetchContextsServerParams {
  courseName: string
  searchQuery: string
  tokenLimit?: number
  docGroups?: string[]
  conversationId?: string
  signal?: AbortSignal
}

/**
 * Server-side context fetching - directly calls the backend instead of going through API
 * Includes retry logic with exponential backoff for transient failures
 */
export async function fetchContextsServer(
  params: FetchContextsServerParams,
): Promise<ContextWithMetadata[]> {
  const {
    courseName,
    searchQuery,
    tokenLimit = 4000,
    docGroups = [],
    conversationId,
    signal,
  } = params

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms))
  const delaysMs = [0, 500, 1000, 2000]
  let lastError: string | null = null
  const isAbortError = (error: unknown) => {
    return (
      signal?.aborted === true ||
      (error instanceof Error && error.name === 'AbortError')
    )
  }

  for (let attempt = 0; attempt < delaysMs.length; attempt++) {
    try {
      if (signal?.aborted) {
        return []
      }

      if (delaysMs[attempt]) await sleep(delaysMs[attempt]!)
      if (signal?.aborted) {
        return []
      }

      const contexts = await fetchContextsFromBackend(
        courseName,
        searchQuery,
        tokenLimit,
        docGroups,
        conversationId,
        signal,
      )

      if (!Array.isArray(contexts)) {
        lastError = `Expected array, got ${typeof contexts}`
        if (attempt < delaysMs.length - 1) {
          console.warn(
            `[fetchContextsServer] retry ${attempt + 1}/${delaysMs.length} failed (${lastError})`,
          )
          continue
        }
        console.error(
          `[fetchContextsServer] failed after ${delaysMs.length} attempts (${lastError})`,
        )
        return []
      }

      return contexts
    } catch (error) {
      if (isAbortError(error)) {
        return []
      }

      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt < delaysMs.length - 1) {
        console.warn(
          `[fetchContextsServer] retry ${attempt + 1}/${delaysMs.length} failed (${lastError})`,
        )
        continue
      }
      console.error(
        `[fetchContextsServer] failed after ${delaysMs.length} attempts (${lastError})`,
      )
      return []
    }
  }

  return []
}

/**
 * Fetch available Sim AI tools for a project (server-side).
 * Hits the Sim API directly instead of going through the Next.js API route.
 */
export async function fetchToolsServer(
  courseName: string,
  simApiKey?: string,
  _limit = 20,
  signal?: AbortSignal,
): Promise<UIUCTool[]> {
  const creds = await resolveSimCredentials(courseName, {
    api_key: simApiKey,
  })

  if (!creds.api_key || !creds.workspace_id) {
    return []
  }

  const simBaseUrl = (creds.base_url ?? SIM_DEFAULT_BASE_URL).replace(/\/$/, '')
  const headers = { 'X-API-Key': creds.api_key }

  try {
    const listUrl = `${simBaseUrl}/api/v1/workflows?workspaceId=${encodeURIComponent(creds.workspace_id)}&deployedOnly=true`
    const listRes = await fetch(listUrl, { headers, signal })

    if (!listRes.ok) {
      console.error('[fetchToolsServer] Sim list failed', listRes.status)
      return []
    }

    const listData = (await listRes.json()) as { data: SimWorkflowListItem[] }
    const items = listData.data ?? []
    if (items.length === 0) return []

    const workflows: SimWorkflow[] = await Promise.all(
      items.map(async (item): Promise<SimWorkflow> => {
        try {
          const detailRes = await fetch(
            `${simBaseUrl}/api/v1/workflows/${item.id}`,
            { headers, signal },
          )
          if (detailRes.ok) {
            const detail = (await detailRes.json()) as Record<string, unknown>
            return {
              id: item.id,
              name: item.name,
              description: item.description ?? '',
              inputFields: extractInputFields(detail),
            }
          }
        } catch (err) {
          console.debug(
            '[fetchToolsServer] detail fetch failed for',
            item.id,
            err,
          )
        }
        return {
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          inputFields: [],
        }
      }),
    )

    return getUIUCToolFromSim(workflows)
  } catch (error) {
    console.error(
      `[Agent] Error fetching Sim tools for course ${courseName}:`,
      error,
    )
    return []
  }
}

function extractInputFields(detail: Record<string, unknown>): SimInputField[] {
  const inner = (detail.data ?? detail) as Record<string, unknown>
  const inputs = inner.inputs
  if (Array.isArray(inputs)) {
    return inputs.map((f: Record<string, unknown>) => ({
      name: String(f.name ?? ''),
      type: String(f.type ?? 'string'),
      description: f.description ? String(f.description) : undefined,
      required: Boolean(f.required ?? false),
    }))
  }
  return []
}

/**
 * Get OpenAI key from LLM providers for a course
 */
export async function getOpenAIKeyForCourse(
  courseName: string,
): Promise<string | null> {
  try {
    // This would typically call the models API to get providers
    // For now, fall back to env variable
    return process.env.VLADS_OPENAI_KEY || null
  } catch (error) {
    console.error('Error getting OpenAI key:', error)
    return null
  }
}

/**
 * Server-side presigned URL generation - bypasses API auth requirement.
 * Wraps the exported generatePresignedUrl from download.ts with null-safe error handling.
 */
export async function generatePresignedUrlServer(
  filePath: string,
  courseName: string,
): Promise<string | null> {
  try {
    return await generatePresignedUrl(filePath, courseName)
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return null
  }
}
