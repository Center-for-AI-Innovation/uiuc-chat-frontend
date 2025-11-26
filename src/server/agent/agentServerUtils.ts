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
import { runN8nFlowBackend } from '~/pages/api/UIUC-api/runN8nFlow'
import fetchContextsFromBackend from '~/pages/util/fetchContexts'
import { getBackendUrl } from '~/utils/apiUtils'
import { generatePresignedUrl } from '~/pages/api/download'
// Reuse existing functions instead of duplicating
import { getOpenAIToolFromUIUCTool, getUIUCToolFromN8n } from '~/utils/functionCalling/handleFunctionCalling'
import { conversationToMessages as baseConversationToMessages } from '~/utils/functionCalling/conversationToMessages'

/**
 * Convert conversation to OpenAI message format for agent mode.
 * Extends base conversationToMessages to append ALL retrieved contexts to the last user message.
 * This is CRITICAL for agent mode - the LLM needs to see full contexts to decide next steps.
 */
function conversationToMessagesWithContexts(
  inputData: Conversation,
): ChatCompletionMessageParam[] {
  // Use base conversion
  const messages = baseConversationToMessages(inputData)
  
  // Find and enhance the last user message with contexts
  const lastMessage = inputData.messages[inputData.messages.length - 1]
  if (lastMessage?.role === 'user' && lastMessage.contexts && lastMessage.contexts.length > 0) {
    // Find the corresponding message in the transformed array (it's the first user message from the end before any tool messages)
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg?.role === 'user' && typeof msg.content === 'string') {
        // Check if this is the last user message by comparing content
        const originalContent = Array.isArray(lastMessage.content) 
          ? (lastMessage.content[0]?.text ?? '') 
          : lastMessage.content
        
        if (msg.content === originalContent || msg.content.startsWith(originalContent.substring(0, 50))) {
          // Append all contexts
          const contextSummary = lastMessage.contexts
            .map((ctx, idx) => `[Context ${idx + 1} from "${ctx.readable_filename}" (page ${ctx.pagenumber || 'N/A'})]: ${ctx.text}`)
            .join('\n\n')
          
          msg.content = `${msg.content}\n\n---\nRetrieved Documents (${lastMessage.contexts.length} total):\n${contextSummary}`
          break
        }
      }
    }
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
  params: SelectToolsServerParams
): Promise<SelectToolsServerResult> {
  const {
    conversation,
    availableTools,
    openaiKey,
    imageUrls = [],
    imageDescription = '',
  } = params

  const lastMessage = conversation.messages[conversation.messages.length - 1]
  if (!lastMessage) {
    return { selectedTools: [], error: 'Conversation missing last message' }
  }

  // Convert UIUCTool to OpenAI compatible format
  const openAITools: ChatCompletionTool[] = getOpenAIToolFromUIUCTool(availableTools) as ChatCompletionTool[]

  // Decrypt the API key
  let decryptedKey = openaiKey
    ? await decryptKeyIfNeeded(openaiKey)
    : process.env.VLADS_OPENAI_KEY

  if (!decryptedKey?.startsWith('sk-')) {
    decryptedKey = process.env.VLADS_OPENAI_KEY as string
  }

  if (!decryptedKey) {
    return { selectedTools: [], error: 'No OpenAI key available for function calling' }
  }

  // Format messages (with contexts appended for agent mode)
  const messagesToSend: ChatCompletionMessageParam[] = conversationToMessagesWithContexts(conversation)

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: messagesToSend,
        tools: openAITools,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return { selectedTools: [], error: `OpenAI API error: ${response.status}` }
    }

    const data = await response.json()

    if (!data.choices) {
      return { selectedTools: [], error: 'No response from OpenAI' }
    }

    if (!data.choices[0]?.message?.tool_calls) {
      // No tools invoked - this is normal when the AI decides not to use any tools
      return { selectedTools: [] }
    }

    const toolCalls = data.choices[0].message.tool_calls as ChatCompletionMessageToolCall[]

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
        aiGeneratedArgumentValues: JSON.parse(openaiTool.function.arguments || '{}'),
      }
    })

    const selectedTools = mappedTools.filter((tool): tool is UIUCTool => tool !== null)

    return { selectedTools }
  } catch (error) {
    console.error('Error in selectToolsServer:', error)
    return {
      selectedTools: [],
      error: error instanceof Error ? error.message : 'Unknown error during tool selection',
    }
  }
}

export interface ExecuteToolServerParams {
  tool: UIUCTool
  projectName: string
  n8nApiKey?: string
}

/**
 * Server-side tool execution for N8N tools.
 * Returns the tool with output/error populated.
 */
export async function executeToolServer(
  params: ExecuteToolServerParams
): Promise<UIUCTool> {
  const { tool, projectName, n8nApiKey } = params
  const toolCopy = { ...tool }

  // Get N8N API key if not provided
  let apiKey = n8nApiKey
  if (!apiKey) {
    try {
      const backendUrl = getBackendUrl()
      const response = await fetch(
        `${backendUrl}/getN8nKeyFromProject?course_name=${projectName}`,
        { method: 'GET' }
      )
      if (response.ok) {
        apiKey = await response.json()
      }
    } catch (error) {
      console.error('Error fetching N8N API key:', error)
    }
  }

  if (!apiKey) {
    toolCopy.error = 'N8N API key not available'
    return toolCopy
  }

  const timeStart = Date.now()

  try {
    const n8nResponse = await runN8nFlowBackend(
      apiKey,
      tool.readableName,
      tool.aiGeneratedArgumentValues,
    )

    const timeEnd = Date.now()
    console.debug(
      'Time taken for n8n function call:',
      (timeEnd - timeStart) / 1000,
      'seconds',
    )

    const resultData = n8nResponse.data.resultData
    const finalNodeType = resultData.lastNodeExecuted

    // Check for N8N tool error
    if (resultData.runData[finalNodeType][0]['error']) {
      const err = resultData.runData[finalNodeType][0]['error']
      const formattedErrMessage = `${err.message}. ${err.description || ''}`
      console.error('N8N tool error:', formattedErrMessage)
      toolCopy.error = formattedErrMessage
      return toolCopy
    }

    // Parse tool output
    if (
      !resultData.runData[finalNodeType][0].data ||
      !resultData.runData[finalNodeType][0].data.main[0][0].json
    ) {
      toolCopy.error = 'Tool executed successfully, but we got an empty response!'
      return toolCopy
    }

    let toolOutput: ToolOutput
    const jsonData = resultData.runData[finalNodeType][0].data.main[0][0].json

    if (jsonData['data']) {
      toolOutput = { data: jsonData['data'] }
    } else if (jsonData['response'] && Object.keys(jsonData).length === 1) {
      toolOutput = { text: jsonData['response'] }
    } else {
      toolOutput = { data: jsonData }
    }

    // Check for images
    if (jsonData['image_urls']) {
      if (Object.keys(jsonData).length === 1) {
        toolOutput = { imageUrls: jsonData['image_urls'] }
      } else {
        toolOutput = { ...toolOutput, imageUrls: jsonData['image_urls'] }
      }
    }

    toolCopy.output = toolOutput
    return toolCopy
  } catch (error: unknown) {
    console.error(`Error running tool ${tool.readableName}:`, error)
    toolCopy.error = error instanceof Error ? error.message : 'Unknown error running tool'
    return toolCopy
  }
}

/**
 * Execute multiple N8N tools in parallel
 */
export async function executeToolsServer(
  tools: UIUCTool[],
  projectName: string,
  n8nApiKey?: string,
): Promise<UIUCTool[]> {
  const results = await Promise.all(
    tools.map((tool) =>
      executeToolServer({ tool, projectName, n8nApiKey })
    )
  )
  return results
}

export interface FetchContextsServerParams {
  courseName: string
  searchQuery: string
  tokenLimit?: number
  docGroups?: string[]
  conversationId?: string
}

/**
 * Server-side context fetching - directly calls the backend instead of going through API
 */
export async function fetchContextsServer(
  params: FetchContextsServerParams
): Promise<ContextWithMetadata[]> {
  const {
    courseName,
    searchQuery,
    tokenLimit = 4000,
    docGroups = [],
    conversationId,
  } = params

  try {
    const contexts = await fetchContextsFromBackend(
      courseName,
      searchQuery,
      tokenLimit,
      docGroups,
      conversationId,
    )
    return contexts
  } catch (error) {
    console.error('Error fetching contexts server-side:', error)
    return []
  }
}

/**
 * Fetch available tools for a project
 */
export async function fetchToolsServer(
  courseName: string,
  n8nApiKey?: string,
  limit = 20,
): Promise<UIUCTool[]> {
  // Get N8N API key if not provided
  let apiKey = n8nApiKey
  if (!apiKey) {
    try {
      const backendUrl = getBackendUrl()
      const response = await fetch(
        `${backendUrl}/getN8nKeyFromProject?course_name=${courseName}`,
        { method: 'GET' }
      )
      if (response.ok) {
        apiKey = await response.json()
      } else if (response.status === 404) {
        console.debug("No N8N API key found for the Project, can't fetch tools")
        return []
      }
    } catch (error) {
      console.error('Error fetching N8N API key:', error)
      return []
    }
  }

  if (!apiKey) {
    console.debug("No N8N API key found, can't fetch tools")
    return []
  }

  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(
      `${backendUrl}/getworkflows?api_key=${apiKey}&limit=${limit}&pagination=false`,
    )

    if (!response.ok) {
      throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
    }

    const workflows = await response.json()
    
    // Use the imported conversion function (no dynamic import needed)
    const uiucTools = getUIUCToolFromN8n(workflows[0])
    return uiucTools
  } catch (error) {
    console.error('Error fetching tools server-side:', error)
    return []
  }
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
