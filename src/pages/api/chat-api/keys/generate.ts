// src/pages/api/chat-api/keys/generate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import posthog from 'posthog-js'
// import { getAuth } from '@clerk/nextjs/server'

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
  res: NextApiResponse<ApiResponse>
) {
  console.log('Received request to generate API key')

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Missing or invalid authorization header')
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    // Get user ID from Keycloak token
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())

    const keycloak_id = decodedPayload.sub
    const clerk_id = decodedPayload.clerk_id
    const preferred_id = clerk_id || keycloak_id

    if (!preferred_id) {
      throw new Error('No user identifier found in token')
    }

    console.log('Generating API key for user:', preferred_id)

    // Check if the user already has an API key
    const { data: keys, error: existingKeyError } = await supabase
      .from('api_keys')
      .select('key, is_active')
      .eq(preferred_id.startsWith('user_') ? 'user_id' : 'keycloak_id', preferred_id)
      .eq('is_active', true)

    if (existingKeyError) {
      console.error('Error retrieving existing API key:', existingKeyError)
      throw existingKeyError
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
      console.log('Inserting new API key record with:', { clerk_id, keycloak_id })
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert([{ 
          user_id: clerk_id,  // Use keycloak_id as fallback for user_id
          keycloak_id: keycloak_id,
          key: apiKey, 
          is_active: true 
        }])

      if (insertError) throw insertError
    } else {
      console.log('Updating existing API key record')
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ key: apiKey, is_active: true })
        .match({ [preferred_id.startsWith('user_') ? 'user_id' : 'keycloak_id']: preferred_id })

      if (updateError) throw updateError
    }

    console.log('Successfully stored API key in database')

    posthog.capture('api_key_generated', {
      keycloak_id,
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
      error: (error as Error).message
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
