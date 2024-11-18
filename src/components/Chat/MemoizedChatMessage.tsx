//MemoizedChatMessage.tsx
import { FC, memo } from 'react'
import { ChatMessage, Props } from './ChatMessage'

export const MemoizedChatMessage: FC<Props> = memo(
  ChatMessage,
  (prevProps, nextProps) => {
    // Deep compare the feedback objects
    const prevFeedback = JSON.stringify(prevProps.message.feedback);
    const nextFeedback = JSON.stringify(nextProps.message.feedback);
    
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.id === nextProps.message.id &&
      prevFeedback === nextFeedback
    );
  }
);
