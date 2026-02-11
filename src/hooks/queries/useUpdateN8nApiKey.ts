import { useMutation } from '@tanstack/react-query'

export function useUpdateN8nApiKey() {
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
  })
}
