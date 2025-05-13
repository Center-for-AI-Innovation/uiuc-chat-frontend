// src/pages/api/chat-api/keys/validate.ts
import { AuthContextProps } from 'react-oidc-context'
import { db, apiKeys, keycloakUsers } from '~/db/dbClient'
import { eq, and, sql } from 'drizzle-orm'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'


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
  const data = await db
    .select({ email: apiKeys.email })
    .from(apiKeys)
    .where(and(eq(apiKeys.key, apiKey), eq(apiKeys.is_active, true)))

  console.log('validateApiKeyAndRetrieveData data', data)

  // Determine if the API key is valid based on the absence of errors and presence of data.
  const isValidApiKey = data.length > 0
  if (!isValidApiKey) {
    return { isValidApiKey, authContext }
  }

  console.log('isValidApiKey', isValidApiKey)
  try {
    const email = data[0]?.email
    if (!email) {
      throw new Error('Email not found')
    }

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

    // Update API key usage count
    await db
      .update(apiKeys)
      .set({ usage_count: sql`${apiKeys.usage_count} + 1` })
      .where(eq(apiKeys.key, apiKey))

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
