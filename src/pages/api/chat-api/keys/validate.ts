// src/pages/api/chat-api/keys/validate.ts
import { AuthContextProps } from 'react-oidc-context'
import { db, apiKeys, client } from '~/db/dbClient'
import { keycloakUsers } from '~/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates the provided API key and retrieves the associated user data.
 *
 * @param {string} apiKey - The API key to validate.
 * @returns An object containing a boolean indicating if the API key is valid,
 *          and the user object if the key is valid.
 */
export async function validateApiKeyAndRetrieveData(apiKey: string) {
  let authContext: AuthContextProps = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: undefined,
  } as AuthContextProps
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
    let keycloakDB: any = null
    let userData: any = null;
    if (process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG?.toLowerCase() === 'true'){
      console.log('Using Illinois Chat config: connect to keycloakDB to fetch user data.')
      const mod = await import('~/db/dbClient')
      keycloakDB = mod.keycloakDB
      const rows = await keycloakDB
        .select()
        .from(keycloakUsers)
        .where(eq(keycloakUsers.email, email))
        .limit(1)
      userData = rows.length > 0 ? rows[0] : null;
    } else {
      console.log('Using UIUC Chat config: use raw SQL to fetch user data from keycloak.user_entity.')
      // raw SQL to avoid schema issues
      const result = await client`
        SELECT *
        FROM keycloak.user_entity
        WHERE email = ${email}
        LIMIT 1
      `;
      userData = result.length > 0 ? result[0] : null;
    }

    if (!userData) {
      throw new Error('User not found');
    }

    // Construct auth context
    authContext = {
      isAuthenticated: true,
      user: {
        profile: {
          sub: String(userData.id),
          email: String(userData.email),
        },
      },
    } as AuthContextProps

    // Update API key usage count
    await db
      .update(apiKeys)
      .set({
        usage_count: sql`${apiKeys.usage_count}
        + 1`,
      })
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
 * @param {NextRequest} req - The incoming HTTP request.
 */
export default async function handler(req: NextRequest) {
  try {
    console.log('req: ', req)
    // Extract the API key and course name from the request body.
    const { api_key, course_name } = (await req.json()) as {
      api_key: string
      course_name: string
    }

    const { isValidApiKey, authContext } =
      await validateApiKeyAndRetrieveData(api_key)

    if (!isValidApiKey) {
      // Respond with a 403 Forbidden status if the API key is invalid.
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
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
