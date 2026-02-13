import { useMutation } from '@tanstack/react-query'

export function useRotateApiKey() {
  return useMutation({
    mutationFn: async ({ courseName }: { courseName: string }) => {
      const response = await fetch(
        `/api/chat-api/keys/rotate?course_name=${courseName}`,
        {
          method: 'PUT',
        },
      )
      if (!response.ok) {
        throw new Error('Failed to rotate API key')
      }
      return response.json() as Promise<{
        message: string
        newApiKey: string
      }>
    },
  })
}
