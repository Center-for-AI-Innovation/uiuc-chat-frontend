import { useMutation } from '@tanstack/react-query'
import {
  logConversationToServer,
  type LogConversationPayload,
} from '@/hooks/__internal__/conversation'

export function useLogConversation(course_name: string) {
  return useMutation({
    mutationKey: ['logConversation', course_name],
    mutationFn: async (payload: LogConversationPayload) =>
      logConversationToServer(payload),
    onError: (error) => {
      console.error('Error logging conversation:', error)
    },
  })
}
