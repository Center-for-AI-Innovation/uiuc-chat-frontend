import { useQuery } from '@tanstack/react-query'
import { type Conversation } from '~/types/chat'
import { fetchLastConversation } from '@/hooks/__internal__/conversation'

export function useFetchLastConversation(courseName: string) {
  return useQuery<Conversation | null>({
    queryKey: ['lastConversation', courseName],
    queryFn: () => fetchLastConversation(courseName),
    enabled: !!courseName, // don’t run until courseName is truthy
  })
}
