// src/pages/api/chat-api/keys/rotate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { db, apiKeys } from '~/db/dbClient'
import { v4 as uuidv4 } from 'uuid'
import { and, eq } from 'drizzle-orm'

type ApiResponse = {
  message?: string
  newApiKey?: string
  error?: string
}

/**
 * API handler to rotate an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the key rotation operation.
 */
export default async function rotateKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
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
      return res.status(400).json({ error: 'No email found in token' })
    }

    console.log('Rotating API key for email:', email)

    // Retrieve existing API key
    const existingKey = await db
      .select({ key: apiKeys.key })
      .from(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, true)))


    if (existingKey.length === 0) {
      return res.status(404).json({
        error: 'API key not found for user, please generate one!',
      })
    }

    // Generate new API key
    const rawApiKey = uuidv4()
    const newApiKey = `uc_${rawApiKey.replace(/-/g, '')}`

    // Update the API key
    try {
      await db
        .update(apiKeys)
        .set({ key: newApiKey, is_active: true, modified_at: new Date() })
        .where(eq(apiKeys.email, email))
      
      console.log('Successfully updated API key for user:', email)
      
      return res.status(200).json({
        message: 'API key rotated successfully',
        newApiKey,
      })

    } catch (error) {
      console.error('Error updating API key:', error)
      return res.status(500).json({ error: 'Error updating API key' })
    }

  } catch (error) {
    console.error('Failed to rotate API key:', error)
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
