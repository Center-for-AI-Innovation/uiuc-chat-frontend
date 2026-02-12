// Mutation: Deletes a single conversation with optimistic cache removal and rollback on error.
import {
  type InfiniteData,
  type QueryClient,
  useMutation,
} from '@tanstack/react-query'
import { type Conversation, type ConversationPage } from '~/types/chat'
import { deleteConversationFromServer } from '@/hooks/__internal__/conversation'

export function useDeleteConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
  search_term: string,
) {
  const normalizedSearchTerm = search_term || ''
  const conversationHistoryKey = [
    'conversationHistory',
    course_name,
    normalizedSearchTerm,
  ] as const

  return useMutation({
    mutationKey: ['deleteConversation', user_email, course_name],
    mutationFn: async (deleteConversation: Conversation) =>
      deleteConversationFromServer(
        deleteConversation.id,
        course_name,
        deleteConversation.userEmail || user_email,
      ),
    onMutate: async (deletedConversation: Conversation) => {
      const previousConversationHistory = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationHistoryKey)

      await queryClient.cancelQueries({ queryKey: conversationHistoryKey })

      queryClient.setQueryData(
        conversationHistoryKey,
        (oldData: InfiniteData<ConversationPage> | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              conversations: page.conversations.filter(
                (c) => c.id !== deletedConversation.id,
              ),
            })),
          }
        },
      )

      return { previousConversationHistory }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(
        conversationHistoryKey,
        context?.previousConversationHistory,
      )
      console.error('Error deleting conversation from server:', error, context)
    },
    onSuccess: (_data, _variables, _context) => {
      // The mutation was successful!
      // Do something with the updated conversation
      // updateConversation(data)
    },
    onSettled: (_data, _error, _variables, _context) => {
      queryClient.invalidateQueries({
        queryKey: conversationHistoryKey,
      })
    },
  })
}
