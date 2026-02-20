// Mutation: Triggers a download of conversation history for a course. Also exports the raw fetch function.
import { useMutation } from '@tanstack/react-query'
import downloadConversationHistory from '../__internal__/downloadConversationHistory'

export { downloadConversationHistory }

export function useDownloadConversationHistoryMutation() {
  return useMutation({
    mutationKey: ['downloadConversationHistory'],
    mutationFn: (courseName: string) => downloadConversationHistory(courseName),
  })
}
