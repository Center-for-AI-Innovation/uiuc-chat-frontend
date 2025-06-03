// src/pages/api/chat-api/keys/validate.ts

import { supabase } from '~/utils/supabaseClient'
import { db } from '~/db/dbClient'
import { keycloakUsers } from '~/db/schema'
import { eq } from 'drizzle-orm'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'
import type { AuthContextProps } from 'react-oidc-context'

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
  let authContext: AuthContextProps = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: undefined,
  } as AuthContextProps
  // console.log('Validating apiKey', apiKey, ' for course_name', course_name)
  // Attempt to retrieve the email associated with the API key from the database
  const { data, error } = await supabase
    .from('api_keys')
    .select('email')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single()

  console.log('data', data)

  // Determine if the API key is valid based on the absence of errors and presence of data.
  const isValidApiKey = !error && data !== null
  if (!isValidApiKey) {
    return { isValidApiKey, authContext }
  }

  console.log('isValidApiKey', isValidApiKey)
  try {
    const email = data.email

    // Get user data from email from keycloak
    const userData = await db.select().from(keycloakUsers).where(eq(keycloakUsers.email, email)).limit(1)

    if (!userData || userData.length === 0) {
      throw new Error('User not found')
    }

    const user = userData[0]
    if (!user) {
      throw new Error('User data is invalid')
    }

    // Construct auth context
    authContext = {
      isAuthenticated: true,
      user: {
        profile: {
          sub: user.id,
          email: user.email,
        },
      },
    } as AuthContextProps

    // Increment the API call count for the user.
    const { error: updateError } = await supabase.rpc('increment', {
      usage: 1,
      apikey: apiKey,
    })

    if (updateError) {
      console.error('Error updating API call count:', updateError)
      throw updateError
    }

    posthog.capture('api_key_validated', {
      email: email,
      apiKey: apiKey,
    })

    return { isValidApiKey, authContext }
  } catch (userError) {
    // Log the error if there's an issue retrieving the user object.
    console.error('Error retrieving user object:', userError)
    posthog.capture('api_key_validation_failed', {
      error: (userError as Error).message,
    })
    throw userError
  }
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

    const { isValidApiKey, authContext } = await validateApiKeyAndRetrieveData(
      api_key,
      course_name,
    )

    if (!isValidApiKey) {
      // Respond with a 403 Forbidden status if the API key is invalid.
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
      return
    }

    // Respond with the user object if the API key is valid.
    return NextResponse.json({ authContext }, { status: 200 })
  } catch (error) {
    // Respond with a 500 Internal Server Error status if an exception occurs.
    console.error('Error in handler:', error)
    return NextResponse.json(
      { error: 'An error occurred while validating the API key' },
      { status: 500 },
    )
  }
}
