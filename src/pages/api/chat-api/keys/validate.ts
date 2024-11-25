// src/pages/api/chat-api/keys/validate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import { clerkClient } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

/**
 * Validates the provided API key and retrieves the associated user data.
 *
 * @param {string} apiKey - The API key to validate.
 * @param {string} course_name - The name of the course (currently unused).
 * @returns An object containing a boolean indicating if the API key is valid,
 *          and the user object if the key is valid.
 */
export async function validateApiKeyAndRetrieveData(
  apiKey: string,
  course_name: string,
) {
  // console.log('Validating apiKey', apiKey, ' for course_name', course_name)
  // Attempt to retrieve the user ID associated with the API key from the database.
  const { data, error } = (await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single()) as { data: { user_id: string } | null; error: Error | null }

  // console.log('data', data)

  // Determine if the API key is valid based on the absence of errors and presence of data.
  const isValidApiKey = !error && data !== null
  let userObject = null

  // console.log('isValidApiKey', isValidApiKey)
  if (isValidApiKey) {
    try {
      // Retrieve the full Clerk user object using the user ID.
      userObject = await clerkClient.users.getUser(data.user_id)

      // Todo: Create a procedure to increment the API call count for the user.
      /**
       * create function increment (usage int, apikey string)
        returns void as
        $$
          update api_keys 
          set usage_count = usage_count + usage
          where api_key = apiKey
        $$ 
        language sql volatile;
       */
      // Increment the API call count for the user.
      const { error: updateError } = await supabase.rpc('increment', {
        usage: 1,
        apikey: apiKey,
      })

      if (updateError) {
        console.error('Error updating API call count:', updateError)
        throw updateError
      }
      // Track the event in PostHog
      posthog.capture('api_key_validated', {
        userId: userObject.id,
        apiKey: apiKey,
      })
    } catch (userError) {
      // Log the error if there's an issue retrieving the user object.
      console.error('Error retrieving user object:', userError)
      posthog.capture('api_key_validation_failed', {
        userId: userObject?.id,
        error: (userError as Error).message,
      })
      throw userError
    }
  }
  // console.log('userObject', userObject, 'isValidApiKey', isValidApiKey)
  return { isValidApiKey, userObject }
}

/**
 * API route handler to validate an API key and return the associated user object.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 */
export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    console.log('req: ', req)
    // Extract the API key and course name from the request body.
    const { api_key, course_name } = (await req.json()) as {
      api_key: string
      course_name: string
    }

    // console.log('api_key', api_key, 'course_name', course_name)

    // Validate the API key and retrieve the user object.
    const { isValidApiKey, userObject } = await validateApiKeyAndRetrieveData(
      api_key,
      course_name,
    )

    if (!isValidApiKey) {
      // Respond with a 403 Forbidden status if the API key is invalid.
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
      return
    }

    // Respond with the user object if the API key is valid.
    return NextResponse.json({ userObject }, { status: 200 })
  } catch (error) {
    // Respond with a 500 Internal Server Error status if an exception occurs.
    console.error('Error in handler:', error)
    return NextResponse.json(
      { error: 'An error occurred while validating the API key' },
      { status: 500 },
    )
  }
}
