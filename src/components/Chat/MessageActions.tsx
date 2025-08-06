import React, { useState, useCallback, useEffect } from 'react'
import { Tooltip } from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconThumbUp,
  IconThumbDown,
  IconThumbUpFilled,
  IconThumbDownFilled,
  IconRepeat,
} from '@tabler/icons-react'
import { type Message, Content } from '@/types/chat'
import { useTranslation } from 'next-i18next'

interface MessageActionsProps {
  message: Message
  messageIndex: number
  isLastMessage: boolean
  onRegenerate?: (messageIndex: number) => void
  onFeedback?: (
    message: Message,
    isPositive: boolean | null,
    category?: string,
    details?: string,
  ) => void
  onOpenFeedbackModal: () => void
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  messageIndex,
  isLastMessage,
  onRegenerate,
  onFeedback,
  onOpenFeedbackModal,
}) => {
  const { t } = useTranslation('chat')
  const [messagedCopied, setMessageCopied] = useState(false)
  const [isThumbsUp, setIsThumbsUp] = useState(false)
  const [isThumbsDown, setIsThumbsDown] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isPositiveFeedback, setIsPositiveFeedback] = useState<boolean>(false)

  // Initialize feedback state based on message
  useEffect(() => {
    if (
      message.feedback &&
      message.feedback.isPositive !== undefined &&
      message.feedback.isPositive !== null
    ) {
      setIsThumbsUp(message.feedback.isPositive)
      setIsThumbsDown(!message.feedback.isPositive)
    } else {
      setIsThumbsUp(false)
      setIsThumbsDown(false)
    }
  }, [message])

  // Copy message content to clipboard
  const copyOnClick = () => {
    if (!navigator.clipboard) return

    let textToCopy = ''

    if (typeof message.content === 'string') {
      textToCopy = message.content
    } else if (Array.isArray(message.content)) {
      // Extract text content from array of Content objects
      textToCopy = message.content
        .filter((content) => content.type === 'text')
        .map((content) => content.text)
        .join(' ')
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setMessageCopied(true)
      setTimeout(() => {
        setMessageCopied(false)
      }, 2000)
    })
  }

  // Handle thumbs up action
  const handleThumbsUp = useCallback(() => {
    if (isThumbsUp) {
      // Unlike action
      setIsThumbsUp(false)
      setIsThumbsDown(false)

      if (onFeedback) {
        onFeedback(message, null) // Pass null to indicate removal of feedback
      }
      return
    }

    // Regular like action
    setIsThumbsUp(true)
    setIsThumbsDown(false)
    setIsPositiveFeedback(true)

    if (onFeedback) {
      onFeedback(message, true)
    }
  }, [isThumbsUp, onFeedback, message])

  // Handle thumbs down action
  const handleThumbsDown = useCallback(() => {
    if (isThumbsDown) {
      // Remove negative feedback
      setIsThumbsUp(false)
      setIsThumbsDown(false)

      if (onFeedback) {
        onFeedback(message, null)
      }
      return
    }

    // Regular thumbs down action
    setIsThumbsUp(false)
    setIsThumbsDown(false) // Don't set to true until feedback is submitted
    setIsPositiveFeedback(false)
    onOpenFeedbackModal()
  }, [isThumbsDown, onFeedback, message, onOpenFeedbackModal])

  // Handle regenerate action
  const handleRegenerate = () => {
    if (onRegenerate) {
      setIsRegenerating(true)
      onRegenerate(messageIndex)
      setTimeout(() => setIsRegenerating(false), 1000)
    }
  }

  return (
    <div className="flex items-center justify-start gap-2">
      <Tooltip
        label={messagedCopied ? 'Copied!' : 'Copy'}
        position="bottom"
        withArrow
        arrowSize={6}
        transitionProps={{
          transition: 'fade',
          duration: 200,
        }}
        style={{
          color: 'var(--tooltip)',
          backgroundColor: 'var(--tooltip-background)',
        }}
      >
        <button
          className={`text-[--foreground-faded] hover:text-[--foreground] ${
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 transition-opacity duration-200 focus:opacity-100 group-hover:opacity-100'
          }`}
          onClick={copyOnClick}
        >
          {messagedCopied ? (
            <IconCheck
              size={20}
              className="text-green-500 dark:text-green-400"
            />
          ) : (
            <IconCopy size={20} />
          )}
        </button>
      </Tooltip>

      <Tooltip
        label={isThumbsUp ? 'Remove Good Response' : 'Good Response'}
        position="bottom"
        withArrow
        arrowSize={6}
        transitionProps={{
          transition: 'fade',
          duration: 200,
        }}
        style={{
          color: 'var(--tooltip)',
          backgroundColor: 'var(--tooltip-background)',
        }}
      >
        <button
          className={`text-[--foreground-faded] hover:text-[--foreground] ${
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 transition-opacity duration-200 focus:opacity-100 group-hover:opacity-100'
          }`}
          onClick={handleThumbsUp}
        >
          <div
            className={
              isLastMessage
                ? ''
                : 'opacity-0 transition-opacity duration-200 group-hover:opacity-100'
            }
          >
            {isThumbsUp ? (
              <IconThumbUpFilled size={20} />
            ) : (
              <IconThumbUp size={20} />
            )}
          </div>
        </button>
      </Tooltip>

      <Tooltip
        label={isThumbsDown ? 'Remove Bad Response' : 'Bad Response'}
        position="bottom"
        withArrow
        arrowSize={6}
        transitionProps={{
          transition: 'fade',
          duration: 200,
        }}
        style={{
          color: 'var(--tooltip)',
          backgroundColor: 'var(--tooltip-background)',
        }}
      >
        <button
          className={`text-[--foreground-faded] hover:text-[--foreground] ${
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 transition-opacity duration-200 focus:opacity-100 group-hover:opacity-100'
          }`}
          onClick={handleThumbsDown}
        >
          {isThumbsDown ? (
            <IconThumbDownFilled size={20} />
          ) : (
            <IconThumbDown size={20} />
          )}
        </button>
      </Tooltip>

      <Tooltip
        label="Regenerate Response"
        position="bottom"
        withArrow
        arrowSize={6}
        transitionProps={{
          transition: 'fade',
          duration: 200,
        }}
        style={{
          color: 'var(--tooltip)',
          backgroundColor: 'var(--tooltip-background)',
        }}
      >
        <button
          className={`text-[--foreground-faded] hover:text-[--foreground] ${
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 transition-opacity duration-200 focus:opacity-100 group-hover:opacity-100'
          } ${isRegenerating ? 'animate-spin' : ''}`}
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          <IconRepeat size={20} />
        </button>
      </Tooltip>
    </div>
  )
}

export default MessageActions
