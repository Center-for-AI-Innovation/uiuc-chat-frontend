import { and, eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db, apiKeys } from '~/db/dbClient'

type ApiResponse = {
  apiKey?: string | null
  error?: string
}

export default async function fetchKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  console.log('Fetching API key...')
  console.log('Request method:', req.method)

  if (req.method !== 'GET') {
    console.log('Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  console.log('Auth header present:', !!authHeader)

  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Missing or invalid auth header')
    return res
      .status(401)
      .json({ error: 'Missing or invalid authorization header' })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())

    // console.log('Token payload:', {
    //   sub: decodedPayload.sub,
    //   userId: decodedPayload.user_id,
    //   preferred_username: decodedPayload.preferred_username,
    //   email: decodedPayload.email,
    //   // Log all claims to see what's available
    //   allClaims: decodedPayload,
    // })

    const email = decodedPayload.email
    if (!email) {
      console.error('No email found in token')
      return res.status(400).json({ error: 'No email found in token' })
    }
    console.log('User email:', email)

    // First delete any inactive keys for this user
    const deleteError = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, false)))

    if (deleteError) {
      console.error('Error deleting inactive keys:', deleteError)
    }

    // Then fetch the remaining (active) key
    const data = await db
      .select({ key: apiKeys.key })
      .from(apiKeys)
      .where(and(eq(apiKeys.email, email), eq(apiKeys.is_active, true)))

    console.log('Db query result:', {
      data: data,
      recordCount: Array.isArray(data) ? data.length : 0,
    })

    if (!data || data.length === 0) {
      return res.status(200).json({ apiKey: null })
    }

    if (data && data.length > 0) {
      return res.status(200).json({ apiKey: data[0]?.key })
    }
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
