import { type QueryClient, useMutation } from '@tanstack/react-query'
import { type Conversation, type ConversationPage } from '~/types/chat'
import { deleteConversationFromServer } from '~/hooks/__internal__/conversation'

export function useDeleteConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
  search_term: string,
) {
  return useMutation({
    mutationKey: ['deleteConversation', user_email, course_name],
    mutationFn: async (deleteConversation: Conversation) =>
      deleteConversationFromServer(deleteConversation.id, course_name),
    onMutate: async (deletedConversation: Conversation) => {
      // Step 1: Cancel the query to prevent it from refetching
      await queryClient.cancelQueries({
        queryKey: [
          'conversationHistory',
          deletedConversation.userEmail,
          course_name,
          '',
        ],
      })
      // Step 2: Perform the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, ''],
        (oldData: ConversationPage | undefined) => {
          if (!oldData || !oldData.conversations) return oldData
          console.log('oldData: ', oldData)
          return {
            ...oldData,
            conversations: oldData.conversations.filter(
              (c: Conversation) => c.id !== deletedConversation.id,
            ),
          }
        },
      )
      // Step 3: Create a context object with the deleted conversation
      const oldConversation = queryClient.getQueryData([
        'conversationHistory',
        deletedConversation.userEmail,
        course_name,
        search_term,
      ])
      // Step 4: Return the deleted and old conversation to the success handler
      return { oldConversation, deletedConversation }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, search_term],
        context?.oldConversation,
      )
      console.error(
        'Error saving updated conversation to server:',
        error,
        context,
      )
    },
    onSuccess: (data, variables, context) => {
      // The mutation was successful!
      // Do something with the updated conversation
      // updateConversation(data)
    },
    onSettled: (data, error, variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name, search_term],
      })
    },
  })
}
