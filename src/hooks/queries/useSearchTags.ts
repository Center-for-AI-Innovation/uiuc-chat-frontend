import { useQuery } from '@tanstack/react-query'
import type {
  SearchTagsResponse,
  TagSuggestion,
} from '~/pages/api/UIUC-api/searchTags'
import type { ChatbotTagCategory } from '~/types/chatbotTags'

export async function fetchTagSuggestions(params: {
  q: string
  category?: ChatbotTagCategory
  limit?: number
}): Promise<TagSuggestion[]> {
  const url = new URL('/api/UIUC-api/searchTags', window.location.origin)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.limit) url.searchParams.set('limit', String(params.limit))

  const response = await fetch(url.pathname + url.search)
  if (!response.ok) {
    throw new Error(`Error fetching tag suggestions: ${response.status}`)
  }
  const data: SearchTagsResponse = await response.json()
  return data.results
}

export function useSearchTags(
  q: string,
  options: {
    category?: ChatbotTagCategory
    limit?: number
    enabled?: boolean
  } = {},
) {
  const { category = 'general', limit = 10, enabled = true } = options
  return useQuery({
    queryKey: ['searchTags', category, q, limit],
    queryFn: () => fetchTagSuggestions({ q, category, limit }),
    enabled,
    staleTime: 30 * 1000,
    // Empty results are fine to cache; keep the popover snappy when typing
    // backwards through a previously-fetched prefix.
    placeholderData: (prev) => prev,
  })
}
