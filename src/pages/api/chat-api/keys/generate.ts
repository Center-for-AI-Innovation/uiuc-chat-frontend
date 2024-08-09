// src/pages/api/chat-api/keys/generate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'

export const config = {
  runtime: 'edge',
}

/**
 * API endpoint to generate a unique API key for a user.
 * The endpoint checks if the user is authenticated and if a key already exists for the user.
 * If not, it generates a new API key, stores it, and returns it to the user.
 *
 * @param {NextRequest} req - The incoming API request.
 * @param {NextResponse} res - The outgoing API response.
 * @returns {Promise<NextResponse>} The response with the API key or an error message.
 */
export default async function generateKey(
  req: NextRequest,
  res: NextResponse,
): Promise<NextResponse> {
  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Get the current user's email
  const currUserId = await getAuth(req).userId
  console.log('Generating api key for: ', currUserId)

  // Ensure the user email is present
  if (!currUserId) {
    return NextResponse.json(
      { error: 'User email is required' },
      { status: 401 },
    )
  }

  try {
    // Check if the user already has an API key
    const { data: keys, error: existingKeyError } = await supabase
      .from('api_keys')
      .select('key, is_active')
      .eq('user_id', currUserId)

    if (existingKeyError) {
      console.error('Error retrieving existing API key:', existingKeyError)
      throw existingKeyError
    }

    if (keys.length > 0 && keys[0]?.is_active) {
      return NextResponse.json(
        { error: 'User already has an API key' },
        { status: 409 },
      )
    }

    // Generate a new API key
    const rawApiKey = uuidv4()

    // Create a sanitized API key by removing dashes and adding a prefix
    const apiKey = `uc_${rawApiKey.replace(/-/g, '')}`

    if (keys.length === 0) {
      // Insert the new API key into the database
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert([{ user_id: currUserId, key: apiKey, is_active: true }])

      if (insertError) {
        throw insertError
      }
    } else {
      // Update the existing API key
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ key: apiKey, is_active: true })
        .match({ user_id: currUserId })

      if (updateError) {
        throw updateError
      }
    }

    // Track the API key generation event
    posthog.capture('api_key_generated', {
      currUserId,
      apiKey,
    })

    // Respond with the generated API key
    return NextResponse.json(
      { message: 'API key generated successfully', apiKey },
      { status: 200 },
    )
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error generating API key:', error)

    // Track the API key generation failure event
    posthog.capture('api_key_generation_failed', {
      userId: currUserId,
      error: (error as Error).message,
    })

    // Respond with a server error message
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
