import { useEffect, useRef } from 'react'
import { Conversation } from '@/types/chat'
import { ConversationComponent } from './Conversation'
import { motion } from 'framer-motion'

interface Props {
  conversations: Conversation[]
  onLoadMore: () => void
}

export const Conversations = ({ conversations, onLoadMore }: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 1.0 },
    )
    // console.log('IntersectionObserver created')

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
      // console.log('IntersectionObserver observing sentinelRef')
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current)
        // console.log('IntersectionObserver unobserving sentinelRef')
      }
    }
  }, [onLoadMore])

  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .filter((conversation) => !conversation.folderId)
        .slice()
        .map((conversation, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <ConversationComponent conversation={conversation} />
          </motion.div>
        ))}
      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}
