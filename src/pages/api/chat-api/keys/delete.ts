import { eq } from 'drizzle-orm'
import type { NextApiResponse } from 'next'
import posthog from 'posthog-js'
import type { ApiKeys } from '~/db/dbClient'
import { apiKeys, db } from '~/db/dbClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'

type ApiResponse = {
  message?: string
  data?: ApiKeys[]
  error?: string
}

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userEmail = req.user?.email
    if (!userEmail) {
      return res.status(400).json({ error: 'User email missing' })
    }

    console.log('Deleting api key for:', userEmail)

    const data = await db
      .update(apiKeys)
      .set({ is_active: false })
      .where(eq(apiKeys.email, userEmail))
      .returning()

    if (data.length === 0) {
      console.error('No API key found for user email:', userEmail)
      throw new Error('No API key found for user email')
    }

    posthog.capture('api_key_deleted', {
      userEmail,
    })

    return res.status(200).json({
      message: 'API key deleted successfully',
      data,
    })
  } catch (error) {
    console.error('Failed to delete API key:', error)

    posthog.capture('api_key_deletion_failed', {
      error: (error as Error).message,
    })

    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
