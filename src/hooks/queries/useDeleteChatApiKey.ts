// Mutation: Deletes a chat API key for a course and nullifies the cached key.
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteChatApiKey(courseName: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/chat-api/keys/delete?course_name=${courseName}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(['chatApiKey', courseName], null)
    },
  })
}
