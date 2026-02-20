// Mutation: Rotates (replaces) an existing chat API key for a course. Invalidates the cached key on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRotateApiKey() {
  const queryClient = useQueryClient()
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
    onSuccess: (_data, { courseName }) => {
      queryClient.invalidateQueries({ queryKey: ['chatApiKey', courseName] })
    },
  })
}
