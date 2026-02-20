import { useMutation } from '@tanstack/react-query'
import downloadConversationHistory, {
  type DownloadConversationHistoryResult,
} from '../__internal__/downloadConversationHistory'

export type DownloadConvoHistoryRequest = {
  projectName: string
}

export type DownloadConvoHistoryResult = DownloadConversationHistoryResult

export function useDownloadConvoHistory() {
  return useMutation<
    DownloadConvoHistoryResult,
    Error,
    DownloadConvoHistoryRequest
  >({
    mutationKey: ['downloadConvoHistory'],
    mutationFn: ({ projectName }) =>
      downloadConversationHistory({ projectName, scope: 'user' }),
    onError: (error) => {
      console.error('Error exporting documents:', error)
    },
  })
}
