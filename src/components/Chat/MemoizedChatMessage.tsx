//MemoizedChatMessage.tsx
import { type FC, memo } from 'react'
import { ChatMessage, type Props } from './ChatMessage'

export const MemoizedChatMessage: FC<Props> = memo(
  ChatMessage,
  (prevProps, nextProps) => {
    // Deep compare the feedback objects
    const prevFeedback = JSON.stringify(prevProps.message.feedback)
    const nextFeedback = JSON.stringify(nextProps.message.feedback)

    // Deep compare agentEvents to ensure timeline updates are shown
    const prevAgentEvents = JSON.stringify(prevProps.message.agentEvents)
    const nextAgentEvents = JSON.stringify(nextProps.message.agentEvents)

    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.id === nextProps.message.id &&
      prevFeedback === nextFeedback &&
      prevAgentEvents === nextAgentEvents
    )
  },
)
