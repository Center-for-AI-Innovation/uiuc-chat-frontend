import { useQuery } from '@tanstack/react-query'
import type {
  ChatbotCardData,
  SearchChatbotsResponse,
} from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

export async function fetchFeaturedChatbots(): Promise<ChatbotCardData[]> {
  const response = await fetch('/api/UIUC-api/getFeaturedChatbots')

  if (!response.ok) {
    throw new Error(`Error fetching featured chatbots: ${response.status}`)
  }

  const data: SearchChatbotsResponse = await response.json()
  return data.results
}

export function useFetchFeaturedChatbots({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['featuredChatbots'],
    queryFn: fetchFeaturedChatbots,
    retry: 1,
    enabled,
    // The placeholder server returns a random sample per request, but caching
    // for 5 minutes keeps the default page stable across nav so cards don't
    // shuffle every time the user re-enters.
    staleTime: 5 * 60 * 1000,
  })
}
