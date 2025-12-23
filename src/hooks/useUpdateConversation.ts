import { type QueryClient, useMutation } from '@tanstack/react-query'
import { type Conversation, type ConversationPage } from '~/types/chat'
import { type FolderWithConversation } from '~/types/folder'
import { saveConversationToServer } from '~/utils/app/conversation'

export function useUpdateConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  // console.log('useUpdateConversation with user_email: ', user_email)
  return useMutation({
    mutationKey: ['updateConversation', user_email, course_name],
    mutationFn: async (conversation: Conversation) =>
      saveConversationToServer(conversation, course_name),
    onMutate: async (updatedConversation: Conversation) => {
      // console.log('Mutation from useUpdateConversation: ', updatedConversation)
      // A mutation is about to happen!
      // Optimistically update the conversation
      // Steps:
      // 1. Cancel the query to prevent it from refetching
      // 2. Use the queryClient to update the conversationHistory query result
      // 3. Add the old conversation to the context
      // 4. Return the updated conversation and old conversation to the success handler
      let oldConversations = null
      let oldFolders = null
      const conversationPage = queryClient.getQueryData([
        'conversationHistory',
        course_name,
        '',
      ]) as ConversationPage

      if (user_email !== undefined) {
        console.log('user_email in update mutation: ', user_email)
        // Step 1: Cancel the query to prevent it from refetching
        await queryClient.cancelQueries({
          queryKey: ['conversationHistory', course_name, ''],
        })

        if (updatedConversation.folderId) {
          await queryClient.cancelQueries({
            queryKey: ['folders', course_name],
          })
        }

        // Step 2: Perform the optimistic update
        queryClient.setQueryData(
          ['conversationHistory', course_name, ''],
          (oldData: ConversationPage | undefined) => {
            if (!oldData || !oldData.conversations) return
            console.log('oldData: ', oldData)
            return {
              ...oldData,
              conversations: oldData.conversations.map((c: Conversation) =>
                c.id === updatedConversation.id ? updatedConversation : c,
              ),
            }
          },
        )

        if (updatedConversation.folderId) {
          queryClient.setQueryData(
            ['folders', course_name],
            (oldData: FolderWithConversation[]) => {
              return oldData.map((f: FolderWithConversation) => {
                if (f.id === updatedConversation.folderId) {
                  return {
                    ...f,
                    conversations: f.conversations?.map((c: Conversation) => {
                      if (c.id === updatedConversation.id) {
                        return updatedConversation
                      }
                      return c
                    }),
                  }
                }
                return f
              })
            },
          )

          oldFolders = (
            queryClient.getQueryData([
              'folders',
              course_name,
            ]) as FolderWithConversation[]
          ).find(
            (f: FolderWithConversation) =>
              f.id === updatedConversation.folderId,
          )
        }

        // Step 3: Add old conversation to react query context
        oldConversations = conversationPage?.conversations?.find(
          (c: Conversation) => c.id === updatedConversation.id,
        ) || { conversations: [], nextCursor: null }
      } else {
        console.log('user_email is undefined in update mutation')
      }
      // Step 4: Return the updated conversation
      return { oldConversations, updatedConversation, oldFolders }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      queryClient.setQueryData(
        ['conversationHistory', course_name, ''],
        context?.oldConversations,
      )
      if (context?.oldFolders) {
        queryClient.setQueryData(['folders', course_name], context?.oldFolders)
      }
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
      // No need to do anything here because the conversationHistory query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name, ''],
      })

      if (context?.oldFolders) {
        queryClient.invalidateQueries({
          queryKey: ['folders', course_name],
        })
      }
    },
  })
}
