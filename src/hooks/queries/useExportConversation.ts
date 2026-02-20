// Mutation: Exports a single conversation as a downloadable file. Also exports the raw fetch function.
import { useMutation } from '@tanstack/react-query'
import handleExport from '../__internal__/handleExport'

export { handleExport }

export function useExportConversationMutation() {
  return useMutation({
    mutationKey: ['exportConversation'],
    mutationFn: (course_name: string) => handleExport(course_name),
  })
}
