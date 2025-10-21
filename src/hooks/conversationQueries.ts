import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { type Conversation, type ConversationPage } from '~/types/chat'
import { type FolderWithConversation } from '~/types/folder'
import {
  deleteAllConversationsFromServer,
  deleteConversationFromServer,
  fetchConversationHistory,
  fetchLastConversation,
  saveConversationMetadata,
} from '~/utils/app/conversation'

export function useFetchConversationHistory(
  user_email: string | undefined,
  searchTerm: string,
  courseName: string | undefined,
) {
  // Ensure searchTerm is initialized even if undefined
  const normalizedSearchTerm = searchTerm || ''

  // For public courses, allow unauthenticated access
  const isValidCourse = typeof courseName === 'string' && courseName.length > 0
  const isEnabled = isValidCourse // Remove email requirement for public courses

  return useInfiniteQuery({
    queryKey: ['conversationHistory', courseName, normalizedSearchTerm],
    queryFn: ({ pageParam = 0 }) => {
      // Additional runtime check to prevent invalid calls
      if (!isValidCourse) {
        throw new Error('Invalid course name')
      }
      return fetchConversationHistory(
        normalizedSearchTerm,
        courseName!,
        pageParam,
        user_email,
      )
    },
    initialPageParam: 0,
    enabled: isEnabled,
    getNextPageParam: (lastPage: ConversationPage | undefined) => {
      if (!lastPage) return null
      return lastPage.nextCursor ?? null
    },
    refetchInterval: 20_000,
  })
}

export function useFetchLastConversation(
  courseName: string,
  userEmail?: string,
) {
  return useQuery<Conversation | null>({
    queryKey: ['lastConversation', courseName, userEmail],
    queryFn: () => fetchLastConversation(courseName, userEmail),
    enabled: !!courseName, // don’t run until courseName is truthy
  })
}

export function useUpdateConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  // console.log('useUpdateConversation with user_email: ', user_email)
  return useMutation({
    mutationKey: ['updateConversation', user_email, course_name],
    mutationFn: async (conversation: Conversation) =>
      saveConversationMetadata(conversation, course_name),
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

export function useDeleteConversation(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
  search_term: string,
) {
  return useMutation({
    mutationKey: ['deleteConversation', user_email, course_name],
    mutationFn: async (deleteConversation: Conversation) =>
      deleteConversationFromServer(
        deleteConversation.id,
        course_name,
        deleteConversation.userEmail || user_email,
      ),
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

export function useDeleteAllConversations(
  queryClient: QueryClient,
  user_email: string,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['deleteAllConversations', user_email, course_name],
    mutationFn: async () =>
      deleteAllConversationsFromServer(course_name, user_email),
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
