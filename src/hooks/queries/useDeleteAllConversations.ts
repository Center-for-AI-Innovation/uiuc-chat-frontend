// Mutation: Deletes all conversations for a project with optimistic cache clearing and delayed invalidation.
import {
  type InfiniteData,
  type QueryClient,
  useMutation,
} from '@tanstack/react-query'
import { type ConversationPage } from '~/types/chat'
import { deleteAllConversationsFromServer } from '@/hooks/__internal__/conversation'

export function useDeleteAllConversations(
  queryClient: QueryClient,
  user_email: string,
  course_name: string,
) {
  const conversationHistoryKey = [
    'conversationHistory',
    course_name,
    '',
  ] as const

  return useMutation({
    mutationKey: ['deleteAllConversations', user_email, course_name],
    mutationFn: async () =>
      deleteAllConversationsFromServer(course_name, user_email),
    onMutate: async () => {
      const previousConversationHistory = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationHistoryKey)

      await queryClient.cancelQueries({ queryKey: conversationHistoryKey })

      queryClient.setQueryData(
        conversationHistoryKey,
        (oldData: InfiniteData<ConversationPage> | undefined) => {
          if (!oldData) {
            return {
              pages: [{ conversations: [], nextCursor: null }],
              pageParams: [0],
            }
          }
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              conversations: [],
              nextCursor: null,
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
      console.error('Error deleting all conversations:', error, context)
    },
    onSettled: (_data, _error, _variables, _context) => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: conversationHistoryKey,
        })
      }, 300)
    },
  })
}
