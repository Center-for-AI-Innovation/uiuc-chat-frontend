import { useCallback, useEffect, useRef } from 'react'
import { type Conversation } from '@/types/chat'
import { ConversationComponent } from './Conversation'
import { motion } from 'framer-motion'

interface Props {
  conversations: Conversation[]
  onLoadMore: () => void
}

export const Conversations = ({ conversations, onLoadMore }: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 1.0 },
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current)
      }
    }
  }, [onLoadMore])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      e.preventDefault()
      const container = listRef.current
      if (!container) return

      const buttons = Array.from(
        container.querySelectorAll<HTMLButtonElement>(
          'button[data-conversation]',
        ),
      )
      if (buttons.length === 0) return

      const currentIndex = buttons.findIndex(
        (btn) => btn === document.activeElement,
      )

      let nextIndex: number
      if (e.key === 'ArrowDown') {
        nextIndex =
          currentIndex < 0 ? 0 : Math.min(currentIndex + 1, buttons.length - 1)
      } else {
        nextIndex =
          currentIndex < 0 ? buttons.length - 1 : Math.max(currentIndex - 1, 0)
      }

      buttons[nextIndex]?.focus()
    },
    [],
  )

  const filteredConversations = conversations.filter(
    (conversation) => !conversation.folderId,
  )

  return (
    <div
      ref={listRef}
      className="flex w-full flex-col gap-1"
      role="listbox"
      aria-label="Chat conversations"
      onKeyDown={handleKeyDown}
    >
      {filteredConversations.slice().map((conversation, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          role="presentation"
        >
          <ConversationComponent
            conversation={conversation}
            isFirstItem={index === 0}
          />
        </motion.div>
      ))}
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}
