import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type {
  SearchChatbotsParams,
  SearchChatbotsResponse,
} from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

function buildSearchUrl(params: SearchChatbotsParams): string {
  const url = new URL('/api/UIUC-api/searchChatbots', window.location.origin)

  if (params.q) url.searchParams.set('q', params.q)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.privacy) url.searchParams.set('privacy', params.privacy)
  if (params.my_bots) url.searchParams.set('my_bots', 'true')

  return url.toString()
}

async function fetchSearchChatbots(
  params: SearchChatbotsParams,
): Promise<SearchChatbotsResponse> {
  const response = await fetch(buildSearchUrl(params))

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }

  return response.json()
}

export function useSearchChatbots(
  params: SearchChatbotsParams,
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: ['searchChatbots', params],
    queryFn: () => fetchSearchChatbots(params),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
