// Query: Fetches the chat API key for a course. Returns null if no key exists.
import { useQuery } from '@tanstack/react-query'

async function fetchChatApiKey(courseName: string): Promise<string | null> {
  const response = await fetch(
    `/api/chat-api/keys/fetch?course_name=${courseName}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch API key')
  }

  const data = await response.json()
  return data.apiKey ?? null
}

export function useFetchChatApiKey(courseName: string, enabled: boolean) {
  return useQuery({
    queryKey: ['chatApiKey', courseName],
    queryFn: () => fetchChatApiKey(courseName),
    enabled,
  })
}
