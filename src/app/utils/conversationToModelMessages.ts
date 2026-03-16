import type { Content, Conversation } from '~/types/chat'
import type { ModelMessage } from 'ai'

export function conversationToModelMessages(
  conversation: Conversation,
): ModelMessage[] {
  const modelMessages: ModelMessage[] = []

  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage?.latestSystemMessage) {
    modelMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage,
    })
  }

  const lastUserId =
    [...conversation.messages].reverse().find((m) => m.role === 'user')?.id ??
    null

  for (const msg of conversation.messages) {
    if (msg.role === 'system') continue

    const isLastUser =
      msg.role === 'user' && lastUserId && msg.id === lastUserId

    const parts: Array<
      { type: 'text'; text: string } | { type: 'image'; image: string }
    > = []

    if (isLastUser && msg.finalPromtEngineeredMessage) {
      parts.push({ type: 'text', text: msg.finalPromtEngineeredMessage })
    } else if (typeof msg.content === 'string') {
      parts.push({ type: 'text', text: msg.content })
    } else if (Array.isArray(msg.content)) {
      const contentArray = msg.content as Content[]
      const textOnly = contentArray
        .filter((c) => c.type === 'text' || c.type === 'file')
        .map((c) => {
          if (c.type === 'text') return c.text || ''
          if (c.type === 'file') {
            return `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`
          }
          return ''
        })
        .filter(Boolean)
        .join('\n')

      if (textOnly) {
        parts.push({ type: 'text', text: textOnly })
      }

      for (const c of contentArray) {
        if (
          (c.type === 'image_url' || c.type === 'tool_image_url') &&
          (c as any).image_url?.url
        ) {
          parts.push({ type: 'image', image: (c as any).image_url.url })
        }
      }
    }

    modelMessages.push({
      role: msg.role as 'user' | 'assistant',
      content: parts.length > 0 ? (parts as any) : '',
    })
  }

  return modelMessages
}
