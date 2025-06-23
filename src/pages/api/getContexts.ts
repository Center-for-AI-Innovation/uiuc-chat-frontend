import { ContextWithMetadata } from '~/types/chat'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, search_query, token_limit = 4000, doc_groups = [] } = req.body

  if (!course_name || !search_query) {
    return res.status(400).json({ 
      error: 'course_name and search_query are required' 
    })
  }

  const requestBody = {
    course_name: course_name,
    search_query: search_query,
    token_limit: token_limit,
    doc_groups: doc_groups,
  }

  try {
    const response = await fetch(`${process.env.RAILWAY_URL}/getTopContexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      return res.status(response.status).json({ 
        error: `Failed to fetch contexts. Status: ${response.status}` 
      })
    }
    
    const data: ContextWithMetadata[] = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching contexts:', error)
    return res.status(500).json({ 
      error: 'Internal server error while fetching contexts',
      data: []
    })
  }
}

// Helper function for backward compatibility
export const fetchContexts = async (
  course_name: string,
  search_query: string,
  token_limit = 4000,
  doc_groups: string[] = [],
): Promise<ContextWithMetadata[]> => {
  try {
    const response = await fetch('/api/getContexts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name,
        search_query,
        token_limit,
        doc_groups,
      }),
    })

    if (!response.ok) {
      console.error('Failed to fetch contexts. Err status:', response.status)
      return []
    }
    
    const data: ContextWithMetadata[] = await response.json()
    return data
  } catch (error) {
    console.error(error)
    return []
  }
}
