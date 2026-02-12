// Mutation: Upserts (creates or updates) the n8n API key for a course. Invalidates the cached key on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateN8nApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      course_name,
      n8n_api_key,
    }: {
      course_name: string
      n8n_api_key: string
    }) => {
      const response = await fetch('/api/UIUC-api/tools/upsertN8nAPIKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_name, n8n_api_key }),
      })
      if (!response.ok) {
        throw new Error('Failed to save n8n API Key')
      }
      return response.json()
    },
    onSettled: (_data, _error, { course_name }) => {
      queryClient.invalidateQueries({
        queryKey: ['n8nApiKey', course_name],
      })
    },
  })
}
