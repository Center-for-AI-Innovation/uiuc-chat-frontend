// src/pages/api/chat-api/keys/rotate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
// import { getAuth } from '@clerk/nextjs/server'

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
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    // Get user ID from Keycloak token
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    const subId = decodedPayload.sub
    const userId = decodedPayload.user_id || subId // Fallback to sub if user_id not present

    console.log('Rotating api key for:', subId)

    // Retrieve existing API key
    const { data: existingKey, error: existingKeyError } = await supabase
      .from('api_keys')
      .select('key')
      .eq('user_id', subId)
      .eq('is_active', true)

    if (existingKeyError) {
      console.error('Error retrieving existing API key:', existingKeyError)
      return res.status(500).json({ error: existingKeyError.message })
    }

    if (!existingKey || existingKey.length === 0) {
      return res.status(404).json({
        error: 'API key not found for user, please generate one!'
      })
    }

    // Generate new API key
    const rawApiKey = uuidv4()
    const newApiKey = `uc_${rawApiKey.replace(/-/g, '')}`

    // Update the API key
    const { error } = await supabase
      .from('api_keys')
      .update({ key: newApiKey, is_active: true, modified_at: new Date() })
      .match({ user_id: subId })

    if (error) {
      console.error('Error updating API key:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      message: 'API key rotated successfully',
      newApiKey
    })
  } catch (error) {
    console.error('Failed to rotate API key:', error)
    return res.status(500).json({
      error: (error as Error).message
    })
  }
}