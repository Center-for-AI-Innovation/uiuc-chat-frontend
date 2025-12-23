import { type QueryClient, useMutation } from '@tanstack/react-query'
import { type ConversationPage } from '~/types/chat'
import { deleteAllConversationsFromServer } from '~/hooks/__internal__/conversation'

export function useDeleteAllConversations(
  queryClient: QueryClient,
  user_email: string,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['deleteAllConversations', user_email, course_name],
    mutationFn: async () => deleteAllConversationsFromServer(course_name),
    onMutate: async () => {
      // Step 1: Cancel the query to prevent it from refetching
      await queryClient.cancelQueries({
        queryKey: ['conversationHistory', course_name, ''],
      })
      // Step 2: Perform the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, ''],
        (oldData: ConversationPage | undefined) =>
          oldData || { conversations: [], nextCursor: null },
      )

      // Step 3: Create a context object with the deleted conversation
      const oldConversationHistory = queryClient.getQueryData([
        'conversationHistory',
        course_name,
        '',
      ]) || { conversations: [], nextCursor: null }
      // Step 4: Return the deleted and old conversation to the success handler
      return { oldConversationHistory }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, ''],
        context?.oldConversationHistory,
      )
      console.error('Error deleting all conversations:', error, context)
      return { context: context?.oldConversationHistory }
    },
    onSettled: (data, error, variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['conversationHistory', course_name, ''],
        })
      }, 300)
    },
  })
}
