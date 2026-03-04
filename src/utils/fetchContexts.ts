import { type ContextWithMetadata } from '~/types/chat'

// Helper function for use in components/utilities
export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
  conversation_id?: string,
): Promise<ContextWithMetadata[]> => {
  try {
    const response = await fetch(`${window.location.origin}/api/getContexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name,
        search_query,
        token_limit,
        doc_groups,
        conversation_id,
      }),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return []
  }
}

// Helper function for backward compatibility
export const fetchMQRContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 6000,
  doc_groups: string[] = [],
  conversation_id: string,
): Promise<ContextWithMetadata[]> => {
  try {
    const params = new URLSearchParams({
      course_name,
      search_query,
      token_limit: token_limit.toString(),
    })

    // Handle doc_groups array
    doc_groups.forEach((group) => params.append('doc_groups', group))

    params.append('conversation_id', conversation_id)

    const response = await fetch(`/api/getContextsMQR?${params.toString()}`)

    if (!response.ok) {
      console.error(
        'Failed to fetch MQR contexts. Err status:',
        response.status,
      )
      return []
    }

    const data: ContextWithMetadata[] = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}
