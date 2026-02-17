import type { Conversation } from '~/types/chat'

export const deriveAgentModeEnabled = (conversation?: Conversation): boolean =>
  typeof conversation?.agentModeEnabled === 'boolean'
    ? conversation.agentModeEnabled
    : (conversation?.messages?.some(
        (msg) => Array.isArray(msg.agentEvents) && msg.agentEvents.length > 0,
      ) ?? false)

export const shouldShowChatLoader = (
  loading: boolean,
  conversation?: Conversation,
): boolean => {
  if (!loading) return false

  const messages = conversation?.messages ?? []
  const lastMessage = messages[messages.length - 1]
  return lastMessage?.role !== 'assistant'
}
