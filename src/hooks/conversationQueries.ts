import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { Message, type Conversation, type ConversationPage } from '~/types/chat'
import { type FolderWithConversation } from '~/types/folder'
import {
  deleteAllConversationsFromServer,
  deleteConversationFromServer,
  fetchConversationHistory,
  saveConversationToServer,
  fetchLastConversation,
} from '~/utils/app/conversation'

function updateConversationInInfiniteData(
  data: InfiniteData<ConversationPage> | undefined,
  updatedConversation: Conversation,
): InfiniteData<ConversationPage> | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      conversations: page.conversations.map((c) =>
        c.id === updatedConversation.id ? updatedConversation : c,
      ),
    })),
  }
}

function removeConversationFromInfiniteData(
  data: InfiniteData<ConversationPage> | undefined,
  deletedConversationId: string,
): InfiniteData<ConversationPage> | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      conversations: page.conversations.filter(
        (c) => c.id !== deletedConversationId,
      ),
    })),
  }
}

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
  const conversationHistoryKey = ['conversationHistory', course_name, ''] as const

  return useMutation({
    mutationKey: ['updateConversation', user_email, course_name],
    mutationFn: async (vars: {
      conversation: Conversation
      message: Message | null
    }) =>
      saveConversationToServer(vars.conversation, course_name, vars.message),
    onMutate: async ({ conversation: updatedConversation }) => {
      // console.log('Mutation from useUpdateConversation: ', updatedConversation)
      // A mutation is about to happen!
      // Optimistically update the conversation
      // Steps:
      // 1. Cancel the query to prevent it from refetching
      // 2. Use the queryClient to update the conversationHistory query result
      // 3. Add the old conversation to the context
      // 4. Return the updated conversation and old conversation to the success handler
      const previousConversationHistory =
        queryClient.getQueryData<InfiniteData<ConversationPage>>(
          conversationHistoryKey,
        )
      const previousFolders = updatedConversation.folderId
        ? queryClient.getQueryData<FolderWithConversation[]>([
            'folders',
            course_name,
          ])
        : undefined

      if (user_email !== undefined) {
        console.log('user_email in update mutation: ', user_email)
        // Step 1: Cancel the query to prevent it from refetching
        await queryClient.cancelQueries({
          queryKey: conversationHistoryKey,
        })

        if (updatedConversation.folderId) {
          await queryClient.cancelQueries({
            queryKey: ['folders', course_name],
          })
        }

        // Step 2: Perform the optimistic update
        queryClient.setQueryData(
          conversationHistoryKey,
          (oldData: InfiniteData<ConversationPage> | undefined) =>
            updateConversationInInfiniteData(oldData, updatedConversation),
        )

        if (updatedConversation.folderId) {
          queryClient.setQueryData(
            ['folders', course_name],
            (oldData: FolderWithConversation[] | undefined) => {
              if (!Array.isArray(oldData)) return oldData
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
        }
      } else {
        console.log('user_email is undefined in update mutation')
      }
      // Step 4: Return the updated conversation
      return { previousConversationHistory, previousFolders, updatedConversation }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      if (context?.previousConversationHistory) {
        queryClient.setQueryData(
          conversationHistoryKey,
          context.previousConversationHistory,
        )
      }
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', course_name], context.previousFolders)
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
        queryKey: conversationHistoryKey,
      })

      if (context?.previousFolders) {
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
  const conversationHistoryKey = [
    'conversationHistory',
    course_name,
    search_term,
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
      const previousConversationHistory =
        queryClient.getQueryData<InfiniteData<ConversationPage>>(
          conversationHistoryKey,
        )

      // Step 1: Cancel the query to prevent it from refetching
      await queryClient.cancelQueries({
        queryKey: conversationHistoryKey,
      })
      // Step 2: Perform the optimistic update
      queryClient.setQueryData(
        conversationHistoryKey,
        (oldData: InfiniteData<ConversationPage> | undefined) =>
          removeConversationFromInfiniteData(oldData, deletedConversation.id),
      )
      // Step 3: Return context for rollback
      return { previousConversationHistory, deletedConversation }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      if (context?.previousConversationHistory) {
        queryClient.setQueryData(
          conversationHistoryKey,
          context.previousConversationHistory,
        )
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
    },
    onSettled: (data, error, variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      queryClient.invalidateQueries({
        queryKey: conversationHistoryKey,
      })
    },
  })
}

export function useDeleteAllConversations(
  queryClient: QueryClient,
  user_email: string,
  course_name: string,
) {
  const conversationHistoryKey = ['conversationHistory', course_name, ''] as const

  return useMutation({
    mutationKey: ['deleteAllConversations', user_email, course_name],
    mutationFn: async () =>
      deleteAllConversationsFromServer(course_name, user_email),
    onMutate: async () => {
      const previousConversationHistory =
        queryClient.getQueryData<InfiniteData<ConversationPage>>(
          conversationHistoryKey,
        )

      // Step 1: Cancel the query to prevent it from refetching
      await queryClient.cancelQueries({
        queryKey: conversationHistoryKey,
      })
      // Step 2: Perform the optimistic update
      queryClient.setQueryData(
        conversationHistoryKey,
        () => ({ pages: [{ conversations: [], nextCursor: null }], pageParams: [0] }),
      )

      // Step 3: Return context for rollback
      return { previousConversationHistory }
    },
    onError: (error, variables, context) => {
      // An error happened!
      // Rollback the optimistic update
      if (context?.previousConversationHistory) {
        queryClient.setQueryData(
          conversationHistoryKey,
          context.previousConversationHistory,
        )
      }
      console.error('Error deleting all conversations:', error, context)
      return { context: context?.previousConversationHistory }
    },
    onSettled: (data, error, variables, context) => {
      // The mutation is done!
      // Do something here, like closing a modal
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: conversationHistoryKey,
        })
      }, 300)
    },
  })
}
