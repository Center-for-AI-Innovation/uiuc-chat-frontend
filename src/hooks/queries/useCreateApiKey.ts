// Mutation: Generates a new chat API key for a course. Invalidates the cached key on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mutationKeys, queryKeys } from './keys'

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: mutationKeys.createApiKey(),
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
    onSuccess: (_data, { courseName }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatApiKey(courseName),
      })
    },
  })
}
