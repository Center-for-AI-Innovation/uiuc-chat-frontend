import { type NextApiRequest, type NextApiResponse } from 'next'
import { type ContextWithMetadata } from '~/types/chat'
import { getBackendUrl } from '~/utils/apiUtils'

// Common function to fetch contexts from backend - can be used anywhere
export const fetchContextsFromBackend = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
  conversation_id?: string,
): Promise<ContextWithMetadata[]> => {
  const backendUrl = getBackendUrl()

  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
    conversation_id: conversation_id,
  }

  // UESFUL FOR TESTING -- SHORTEN CONTEXTS
  // const dummyContexts: ContextWithMetadata[] = [
  //   {
  //     id: 1,
  //     text: 'This is a dummy context',
  //     readable_filename: 'dummy_filename_1.pdf',
  //     course_name: 'dummy course 1',
  //     'course_name ': 'dummy course 1',
  //     s3_path: 'dummy_s3_path_1',
  //     pagenumber: '1',
  //     url: 'dummy_url_1',
  //     base_url: 'dummy_base_url_1',
  //   },
  //   {
  //     id: 2,
  //     text: 'This is another dummy context',
  //     readable_filename: 'dummy_filename_2.pdf',
  //     course_name: 'dummy course 2',
  //     'course_name ': 'dummy course 2',
  //     s3_path: 'dummy_s3_path_2',
  //     pagenumber: '2',
  //     url: 'dummy_url_2',
  //     base_url: 'dummy_base_url_2',
  //   },
  // ]
  // return dummyContexts

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { course_name, search_query, token_limit = 4000, doc_groups = [], conversation_id } = req.body

    if (!course_name || !search_query) {
      return res.status(400).json({ 
        error: 'course_name and search_query are required' 
      })
    }

    // Use the common function
    const data = await fetchContextsFromBackend(course_name, search_query, token_limit, doc_groups, conversation_id)
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return res.status(500).json({ 
      error: 'Internal server error while fetching contexts',
      data: []
    })
  }
}

// Helper function for use in components/utilities
export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
  conversation_id?: string,
): Promise<ContextWithMetadata[]> => {
  // Check if we're running on client-side (browser) or server-side
  const isClientSide = typeof window !== 'undefined'

  try {
    if (isClientSide) {
      // Client-side: use our API route
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
      
      const data: ContextWithMetadata[] = await response.json()
      return data
    } else {
      // Server-side: use the common function directly
      return await fetchContextsFromBackend(course_name, search_query, token_limit, doc_groups, conversation_id)
    }
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return []
  }
}
