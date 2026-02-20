// Mutation: Triggers a download of conversation history for a course. Also exports the raw fetch function.
import { useMutation } from '@tanstack/react-query'
import downloadConversationHistory, {
  type DownloadConversationHistoryResult,
} from '../__internal__/downloadConversationHistory'
import { mutationKeys } from './keys'

export { downloadConversationHistory }

export function useDownloadConversationHistoryMutation() {
  return useMutation<DownloadConversationHistoryResult, Error, string>({
    mutationKey: mutationKeys.downloadConversationHistory(),
    mutationFn: (courseName: string) =>
      downloadConversationHistory({ projectName: courseName, scope: 'course' }),
  })
}
