import { ContextWithMetadata } from '~/types/chat'

export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
  conversation_id?: string,
): Promise<ContextWithMetadata[]> => {
  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
    conversation_id: conversation_id,
  }

  //const url = `http://localhost:8000/getTopContexts`
  const url = `https://flask-production-751b.up.railway.app/getTopContexts`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      throw new Error('Failed to fetch contexts. Err status:' + response.status)
    }
    const data: ContextWithMetadata[] = await response.json()

    return data
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}
export default fetchContexts
