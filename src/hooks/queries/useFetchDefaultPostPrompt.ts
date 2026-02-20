// Query: Fetches the default post-prompt text. Cached indefinitely (infinite staleTime).
import { useQuery } from '@tanstack/react-query'

async function fetchDefaultPostPrompt(): Promise<string> {
  const response = await fetch('/api/getDefaultPostPrompt')
  if (!response.ok) {
    throw new Error(
      `Failed to fetch default prompt: ${response.status} ${response.statusText}`,
    )
  }
  const data = await response.json()
  return data.prompt
}

export function useFetchDefaultPostPrompt({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['defaultPostPrompt'],
    queryFn: fetchDefaultPostPrompt,
    staleTime: Infinity,
    enabled,
  })
}
