// Mutation: Tests the validity of an n8n API key by making a verification request.
import { useMutation } from '@tanstack/react-query'

export function useTestN8nAPI() {
  return useMutation({
    mutationFn: async ({ n8nApiKey }: { n8nApiKey: string }) => {
      const response = await fetch(`/api/UIUC-api/tools/testN8nAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ n8nApiKey }),
      })
      if (!response.ok) {
        throw new Error('Key appears invalid')
      }
      return response.json()
    },
  })
}
