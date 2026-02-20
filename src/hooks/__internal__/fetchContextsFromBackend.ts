import { type ContextWithMetadata } from '~/types/chat'
import { getBackendUrl } from '~/utils/apiUtils'

// Common function to fetch contexts from backend - can be used anywhere
export default async function fetchContextsFromBackend(
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
  conversation_id?: string,
): Promise<ContextWithMetadata[]> {
  const backendUrl = getBackendUrl()

  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
    conversation_id: conversation_id,
  }

  const response = await fetch(`${backendUrl}/getTopContexts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch contexts. Status: ${response.status}`)
  }

  const data: ContextWithMetadata[] = await response.json()
  return data
}
