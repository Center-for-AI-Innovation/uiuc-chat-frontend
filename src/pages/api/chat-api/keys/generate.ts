// src/pages/api/chat-api/keys/generate.ts

import { and, eq } from 'drizzle-orm'
import type { NextApiResponse } from 'next'
import posthog from 'posthog-js'
import { v4 as uuidv4 } from 'uuid'
import { apiKeys, db } from '~/db/dbClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'
import type { AuthenticatedRequest } from '~/utils/authMiddleware'
type ApiResponse = {
  message?: string
  apiKey?: string
  error?: string
}

/**
 * API endpoint to generate a unique API key for a user.
 * The endpoint checks if the user is authenticated and if a key already exists for the user.
 * If not, it generates a new API key, stores it, and returns it to the user.
 *
 * @param {NextApiRequest} req - The incoming API request.
 * @param {NextApiResponse} res - The outgoing API response.
 * @returns {Promise<void>} The response with the API key or an error message.
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>,
) {
  console.log('Received request to generate API key')

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const email = req.user?.email
    if (!email) {
      return res.status(400).json({ error: 'User email missing' })
    }
    const userId = req.user?.sub
    if (!userId) {
      return res.status(400).json({ error: 'User id missing' })
    }

    console.log('Generating API key for user email:', email)

    // Check if the user already has an API key
    const keys = await db
      .select({ key: apiKeys.key, is_active: apiKeys.is_active })
      .from(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, true)))

    if (!keys) {
      console.error('Error retrieving API keys from DB')
      throw new Error('Failed to fetch API keys')
    }

    console.log('Existing keys found:', keys.length)

    if (keys.length > 0 && keys[0]?.is_active) {
      console.log('User already has an active API key')
      return res.status(409).json({ error: 'User already has an API key' })
    }

    // Generate new API key
    const rawApiKey = uuidv4()
    const apiKey = `uc_${rawApiKey.replace(/-/g, '')}`
    console.log('Generated new API key')

    if (keys.length === 0) {
      console.log('Inserting new API key record')
      try {
        const result = await db.insert(apiKeys).values({
          email: email,
          user_id: userId,
          key: apiKey,
          is_active: true,
        })

        console.log('Successfully inserted new API key record:', result)
      } catch (error) {
        console.error('Failed to insert API key record:', error)
        throw error
      }
    } else {
      console.log('Updating existing API key record')
      try {
        await db
          .update(apiKeys)
          .set({
            key: apiKey,
            is_active: true,
            user_id: req.user?.sub,
          })
          .where(eq(apiKeys.email, email))

        console.log('Successfully updated API key record')
      } catch (error) {
        console.error('Failed to update API key record:', error)
        throw error
      }
    }

    posthog.capture('api_key_generated', {
      email,
      apiKey,
    })
    console.log('API key generation successful')
    return res.status(200).json({
      message: 'API key generated successfully',
      apiKey,
    })
  } catch (error) {
    console.error('Error generating API key:', error)
    posthog.capture('api_key_generation_failed', {
      error: (error as Error).message,
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
