import { useMutation } from '@tanstack/react-query'

export function useGenerateApiKey() {
  return useMutation({
    mutationFn: async ({ courseName }: { courseName: string }) => {
      const response = await fetch(
        `/api/chat-api/keys/generate?course_name=${courseName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      if (!response.ok) {
        throw new Error('Failed to generate API key')
      }
      return response.json() as Promise<{ message: string; apiKey: string }>
    },
  })
}
