import { useMutation } from '@tanstack/react-query'
import handleExport from '../__internal__/handleExport'

export { handleExport }

export function useHandleExportMutation() {
  return useMutation({
    mutationKey: ['handleExport'],
    mutationFn: (course_name: string) => handleExport(course_name),
  })
}
