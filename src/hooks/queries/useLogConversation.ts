import { useMutation } from '@tanstack/react-query'
import { type Conversation } from '~/types/chat'
import { logConversationToServer } from '@/hooks/__internal__/conversation'

export function useLogConversation(course_name: string) {
  return useMutation({
    mutationKey: ['logConversation', course_name],
    mutationFn: async (conversation: Conversation) =>
      logConversationToServer(conversation, course_name),
    onError: (error) => {
      console.error('Error logging conversation:', error)
    },
  })
}
