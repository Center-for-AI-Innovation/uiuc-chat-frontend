// src/pages/api/UIUC-api/getConversationStats.ts
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { course_name, from_date, to_date } = req.body

  if (!course_name) {
    return res
      .status(400)
      .json({ error: 'Missing required course_name parameter' })
  }

  try {
    const url = new URL(`${getBackendUrl()}/getConversationStats`)
    url.searchParams.append('course_name', course_name)
    if (from_date) url.searchParams.append('from_date', from_date)
    if (to_date) url.searchParams.append('to_date', to_date)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const data = await response.json()

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching questions per day:', error)
    return res.status(500).json({ error: 'Failed to fetch questions per day' })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)

export async function getConversationStats(
  course_name: string,
  from_date?: string,
  to_date?: string,
) {
  try {
    const url = new URL(
      '/api/UIUC-api/getConversationStats',
      window.location.origin,
    )
    url.searchParams.append('course_name', course_name)
    if (from_date) url.searchParams.append('from_date', from_date)
    if (to_date) url.searchParams.append('to_date', to_date)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }
    return {
      status: response.status,
      data: await response.json(),
    }
  } catch (error) {
    console.error('Error fetching conversation stats:', error)
    throw error
  }
}
