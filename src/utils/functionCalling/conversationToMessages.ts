// Shared utility for converting conversation to OpenAI message format
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions'
import { type Conversation, type UIUCTool } from '~/types/chat'

/**
 * Convert conversation to OpenAI message format for function calling.
 * Handles tool calls and tool results formatting.
 */
export const conversationToMessages = (
  inputData: Conversation,
): ChatCompletionMessageParam[] => {
  const transformedData: ChatCompletionMessageParam[] = []

  inputData.messages.forEach((message, index) => {
    const simpleMessage: ChatCompletionMessageParam = {
      role: message.role,
      content: Array.isArray(message.content)
        ? (message.content[0]?.text ?? '')
        : message.content,
    }
    transformedData.push(simpleMessage)

    // For the last message, check if it has tool results and format them properly
    // This is important for agent mode where tool results from previous steps need to be included
    if (
      index === inputData.messages.length - 1 &&
      message.tools &&
      message.tools.length > 0
    ) {
      // Check if tools have results (have been executed)
      const toolsWithResults = message.tools.filter(
        (tool): tool is UIUCTool =>
          tool.invocationId !== undefined &&
          (tool.output !== undefined || tool.error !== undefined),
      )

      if (toolsWithResults.length > 0) {
        // Create an assistant message with tool_calls for tools that have results
        // This matches OpenAI's expected format: assistant message with tool_calls, followed by tool results
        const toolCalls: ChatCompletionMessageFunctionToolCall[] =
          toolsWithResults
            .map((tool): ChatCompletionMessageFunctionToolCall | null => {
              if (!tool.invocationId) return null
              return {
                id: tool.invocationId,
                type: 'function' as const,
                function: {
                  name: tool.name,
                  arguments: JSON.stringify(
                    tool.aiGeneratedArgumentValues || {},
                  ),
                },
              }
            })
            .filter(
              (call): call is ChatCompletionMessageFunctionToolCall =>
                call !== null,
            )

        if (toolCalls.length > 0) {
          transformedData.push({
            role: 'assistant',
            content: null,
            tool_calls: toolCalls,
          })

          // Add tool result messages
          toolsWithResults.forEach((tool) => {
            if (!tool.invocationId) return

            let toolContent: string

            if (tool.error) {
              toolContent = `Error: ${tool.error}`
            } else if (tool.output?.text) {
              toolContent = tool.output.text
            } else if (tool.output?.data) {
              toolContent = JSON.stringify(tool.output.data)
            } else if (
              tool.output?.imageUrls &&
              tool.output.imageUrls.length > 0
            ) {
              toolContent = `Images generated: ${tool.output.imageUrls.join(', ')}`
            } else {
              // Skip tools without valid output (shouldn't happen due to filter above)
              return
            }

            const toolMessage: ChatCompletionToolMessageParam = {
              role: 'tool',
              tool_call_id: tool.invocationId,
              content: toolContent,
            }
            transformedData.push(toolMessage)
          })
        }
      }
    }
  })

  return transformedData
}
