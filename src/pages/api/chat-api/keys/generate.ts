// src/pages/api/chat-api/keys/generate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { db, apiKeys } from '~/db/dbClient'
import { v4 as uuidv4 } from 'uuid'
import posthog from 'posthog-js'
import { and, eq } from 'drizzle-orm'
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
export default async function generateKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  console.log('Received request to generate API key')

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Missing or invalid authorization header')
    return res
      .status(401)
      .json({ error: 'Missing or invalid authorization header' })
  }

  try {
    // Get user email from token
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())

    const email = decodedPayload.email
    if (!email) {
      throw new Error('No email found in token')
    }

    console.log('Generating API key for user email:', email)

    // Check if the user already has an API key
    const keys = await db
      .select({ key: apiKeys.key, is_active: apiKeys.is_active })
      .from(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, true)))

    if (keys.length === 0) {
      console.error('No existing API key found for user email:', email)
      throw new Error('No existing API key found for user email')
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
          user_id: decodedPayload.sub,
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
            user_id: decodedPayload.sub,
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
