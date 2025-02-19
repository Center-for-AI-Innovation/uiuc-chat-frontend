// src/pages/api/chat-api/keys/rotate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { getAuth } from '@clerk/nextjs/server'

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
  // Only allow PUT requests, reject all others with method not allowed error.
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get the current user's email
  const currUserId = getAuth(req).userId
  console.log('Rotating api key for: ', currUserId)

  // Ensure the user email is present
  if (!currUserId) {
    return res.status(401).json({ error: 'User email is required' })
  }

  // Retrieve the existing API key for the user.
  const { data: existingKey, error: existingKeyError } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', currUserId)
    .eq('is_active', true)

  // Handle potential errors during retrieval of the existing key.
  if (existingKeyError) {
    console.error('Error retrieving existing API key:', existingKeyError)
    return res.status(500).json({ error: existingKeyError.message })
  }

  // If no existing key is found, inform the user to generate one.
  if (!existingKey || existingKey.length === 0) {
    return res.status(404).json({
      error: 'API key not found for user, please generate one!'
    })
  }

  // Generate a new API key.
  const rawApiKey = uuidv4()

  // Create a sanitized API key by removing dashes and adding a prefix
  const newApiKey = `uc_${rawApiKey.replace(/-/g, '')}`

  // Update the API key in the database with the new key.
  const { data, error } = await supabase
    .from('api_keys')
    .update({ key: newApiKey, is_active: true, modified_at: new Date() })
    .match({ user_id: currUserId })

  // Handle potential errors during the update operation.
  if (error) {
    console.error('Error updating API key:', error)
    return res.status(500).json({ error: error.message })
  }

  // Respond with a success message and the new API key.
  return res.status(200).json({
    message: 'API key rotated successfully',
    newApiKey
  })
}
