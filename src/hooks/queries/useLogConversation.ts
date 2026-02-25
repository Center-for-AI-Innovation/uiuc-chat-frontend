// Mutation: Logs a conversation to the server (used after chat interactions).
import { useMutation } from '@tanstack/react-query'
import {
  logConversationToServer,
  type LogConversationPayload,
} from '@/hooks/__internal__/conversation'
import { mutationKeys } from './keys'

export function useLogConversation(course_name: string) {
  return useMutation({
    mutationKey: mutationKeys.logConversation(course_name),
    mutationFn: async (payload: LogConversationPayload) =>
      logConversationToServer(payload),
    onError: (error) => {
      console.error('Error logging conversation:', error)
    },
  })
}
