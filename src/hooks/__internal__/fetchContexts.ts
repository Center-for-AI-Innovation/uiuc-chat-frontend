import { type ContextWithMetadata } from '~/types/chat'
import { type FetchContextsParams } from '../queries/useFetchContexts'
import { getBaseUrl } from '~/utils/apiUtils'

export async function fetchContexts({
  course_name,
  user_id,
  search_query,
  token_limit = 4000,
  doc_groups = ['All Documents'],
  conversation_id,
}: FetchContextsParams): Promise<ContextWithMetadata[]> {
  const endpoint = `${getBaseUrl()}/api/getContexts`

  const requestBody = {
    course_name,
    user_id,
    search_query,
    token_limit,
    doc_groups,
    conversation_id,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(
      `Error fetching contexts: ${response.statusText || response.status}`,
    )
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    return []
  }

  return data as ContextWithMetadata[]
}
