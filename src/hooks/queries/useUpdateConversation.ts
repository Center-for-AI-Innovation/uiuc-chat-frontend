// Mutation: Updates a conversation (rename, move to folder) with optimistic cache updates and rollback.
import {
  type InfiniteData,
  type QueryClient,
  useMutation,
} from '@tanstack/react-query'
import type { Message, Conversation, ConversationPage } from '~/types/chat'
import { type FolderWithConversation } from '~/types/folder'
import { saveConversationToServer } from '@/hooks/__internal__/conversation'

export function useUpdateConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  // console.log('useUpdateConversation with user_email: ', user_email)
  return useMutation({
    mutationKey: ['updateConversation', user_email, course_name],
    mutationFn: async (vars: {
      conversation: Conversation
      message: Message | null
    }) =>
      saveConversationToServer(vars.conversation, course_name, vars.message),
    onMutate: async ({ conversation: updatedConversation }) => {
      const conversationHistoryKey = ['conversationHistory', course_name, '']
      const foldersKey = ['folders', course_name]

      const previousConversationHistory = queryClient.getQueryData<
        InfiniteData<ConversationPage>
      >(conversationHistoryKey)
      const previousFolders =
        queryClient.getQueryData<FolderWithConversation[]>(foldersKey)

      await queryClient.cancelQueries({ queryKey: conversationHistoryKey })
      if (updatedConversation.folderId) {
        await queryClient.cancelQueries({ queryKey: foldersKey })
      }

      queryClient.setQueryData(
        conversationHistoryKey,
        (oldData: InfiniteData<ConversationPage> | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              conversations: page.conversations.map((c) =>
                c.id === updatedConversation.id ? updatedConversation : c,
              ),
            })),
          }
        },
      )

      if (updatedConversation.folderId) {
        queryClient.setQueryData(
          foldersKey,
          (oldData: FolderWithConversation[] | undefined) => {
            if (!Array.isArray(oldData)) return oldData
            return oldData.map((f) => {
              if (f.id !== updatedConversation.folderId) return f
              return {
                ...f,
                conversations: (f.conversations || []).map((c) =>
                  c.id === updatedConversation.id ? updatedConversation : c,
                ),
              }
            })
          },
        )
      }

      return { previousConversationHistory, previousFolders }
    },
    onError: (error, _variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, ''],
        context?.previousConversationHistory,
      )
      if (context?.previousFolders) {
        queryClient.setQueryData(
          ['folders', course_name],
          context.previousFolders,
        )
      }
      console.error(
        'Error saving updated conversation to server:',
        error,
        context,
      )
    },
    onSuccess: (_data, _variables, _context) => {
      // The mutation was successful!
      // Do something with the updated conversation
      // updateConversation(data)
      // No need to do anything here because the conversationHistory query will be invalidated
    },
    onSettled: (_data, _error, _variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name, ''],
      })

      if (context?.previousFolders) {
        queryClient.invalidateQueries({
          queryKey: ['folders', course_name],
        })
      }
    },
  })
}
