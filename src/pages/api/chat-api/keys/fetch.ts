import { and, eq } from 'drizzle-orm'
import type { NextApiResponse } from 'next'
import { db, apiKeys } from '~/db/dbClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'

type ApiResponse = {
  apiKey?: string | null
  error?: string
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>,
) {
  console.log('Fetching API key...')
  console.log('Request method:', req.method)

  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const email = req.user?.email
    if (!email) {
      console.error('No email found in token')
      return res.status(400).json({ error: 'No email found in token' })
    }
    console.log('User email:', email)

    // First delete any inactive keys for this user
    const deleteError = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, false)))

    if (deleteError) {
      console.error('Error deleting inactive keys:', deleteError)
    }

    // Then fetch the remaining (active) key
    const data = await db
      .select({ key: apiKeys.key })
      .from(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, true)))

    console.log('Db query result:', {
      data: data,
      recordCount: Array.isArray(data) ? data.length : 0,
    })

    if (!data || data.length === 0) {
      return res.status(200).json({ apiKey: null })
    }

    if (data && data.length > 0) {
      return res.status(200).json({ apiKey: data[0]?.key })
    }
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
