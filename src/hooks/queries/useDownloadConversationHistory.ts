import { useMutation } from '@tanstack/react-query'
import downloadConversationHistory from '../__internal__/downloadConversationHistory'

export { downloadConversationHistory }

export function useDownloadConversationHistoryMutation() {
  return useMutation({
    mutationKey: ['downloadConversationHistory'],
    mutationFn: (courseName: string) => downloadConversationHistory(courseName),
  })
}
