import { type AuthenticatedRequest, type NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
import axios, { type AxiosResponse } from 'axios'
import { type ContextWithMetadata } from '~/types/chat'

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    course_name,
    search_query,
    token_limit = 6000,
    doc_groups = [],
    conversation_id,
  } = req.query

  if (!course_name || !search_query || !conversation_id) {
    return res.status(400).json({
      error: 'course_name, search_query, and conversation_id are required',
    })
  }

  try {
    // Note: This uses a different Railway service endpoint than the main RAILWAY_URL
    const mqrUrl = process.env.RAILWAY_MQR_URL
    if (!mqrUrl) {
      throw new Error(
        'No MQR backend URL configured. Please set RAILWAY_MQR_URL environment variable.',
      )
    }
    const response: AxiosResponse<ContextWithMetadata[]> = await axios.get(
      `${mqrUrl}/getTopContextsWithMQR`,
      {
        params: {
          course_name: course_name,
          search_query: search_query,
          token_limit: token_limit,
          doc_groups: Array.isArray(doc_groups)
            ? doc_groups
            : [doc_groups].filter(Boolean),
          conversation_id: conversation_id,
        },
      },
    )
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Error fetching MQR contexts:', error)
    return res.status(500).json({
      error: 'Internal server error while fetching MQR contexts',
      data: [],
    })
  }
}

export default withAuth(handler)

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
