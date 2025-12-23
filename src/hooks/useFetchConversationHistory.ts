import { useInfiniteQuery } from '@tanstack/react-query'
import { ConversationPage } from '~/types/chat'
import { fetchConversationHistory } from '~/utils/app/conversation'

export function useFetchConversationHistory(
  user_email: string | undefined,
  searchTerm: string,
  courseName: string | undefined,
) {
  // Ensure searchTerm is initialized even if undefined
  const normalizedSearchTerm = searchTerm || ''

  // Move the type checking outside of Boolean to handle each case explicitly
  const isValidEmail = typeof user_email === 'string' && user_email.length > 0
  const isValidCourse = typeof courseName === 'string' && courseName.length > 0
  const isEnabled = isValidEmail && isValidCourse

  return useInfiniteQuery({
    queryKey: ['conversationHistory', courseName, normalizedSearchTerm],
    queryFn: ({ pageParam = 0 }) => {
      // Additional runtime check to prevent invalid calls
      if (!isValidEmail || !isValidCourse) {
        throw new Error('Invalid email or course name')
      }
      return fetchConversationHistory(
        normalizedSearchTerm,
        courseName!,
        pageParam,
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
