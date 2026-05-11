import { useQuery } from '@tanstack/react-query'
import type {
  ChatbotCardData,
  SearchChatbotsResponse,
} from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

async function fetchAccessibleChatbots(): Promise<ChatbotCardData[]> {
  // Fetch all public chatbots via the search API (no filters = all non-frozen)
  const response = await fetch('/api/UIUC-api/searchChatbots?privacy=public')

  if (!response.ok) {
    throw new Error(`Error fetching accessible chatbots: ${response.status}`)
  }

  const data: SearchChatbotsResponse = await response.json()
  return data.results
}

export function useFetchAccessibleChatbots({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['accessibleChatbots'],
    queryFn: fetchAccessibleChatbots,
    retry: 1,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
