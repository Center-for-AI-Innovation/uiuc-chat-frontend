import { useInfiniteQuery } from '@tanstack/react-query'
import { type ConversationPage } from '~/types/chat'
import { fetchConversationHistory } from '@/hooks/__internal__/conversation'

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
