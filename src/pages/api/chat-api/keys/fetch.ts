// src/pages/api/chat-api/keys/fetch.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
// import { getAuth } from '@clerk/nextjs/server'

type ApiResponse = {
  apiKey?: string | null
  error?: string
}

export default async function fetchKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
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
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())

    console.log('Token payload:', {
      sub: decodedPayload.sub,
      userId: decodedPayload.user_id,
      preferred_username: decodedPayload.preferred_username,
      email: decodedPayload.email,
      clerk_id: decodedPayload.clerk_id,
      // Log all claims to see what's available
      allClaims: decodedPayload
    })

    const keycloak_id = decodedPayload.sub
    const clerk_id = decodedPayload.clerk_id // Fallback to sub if user_id not present
    console.log("Keycloak ID:", keycloak_id, "Clerk ID:", clerk_id)

    // const { data, error } = await supabase
    //   .from('api_keys')
    //   .select('key')
    //   .eq('user_id', subId)
    //   .eq('is_active', true)

    // First delete any inactive keys for this user
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .or(`user_id.eq."${clerk_id}",keycloak_id.eq."${keycloak_id}"`)
      .eq('is_active', false)

    if (deleteError) {
      console.error("Error deleting inactive keys:", deleteError)
    }

    // Then fetch the remaining (active) key
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .or(`user_id.eq."${clerk_id}",keycloak_id.eq."${keycloak_id}"`)

    console.log('Supabase query result:', {
      // hasData: Array.isArray(data) && data.length > 0,
      data: data,
      recordCount: Array.isArray(data) ? data.length : 0,
      hasError: !!error,
      error
    })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log('No API key found for user')
      return res.status(200).json({ apiKey: null })
    }

    if (data && data.length > 0) {
      console.log('API key found for user')
      return res.status(200).json({ apiKey: data[0]?.key })
    }
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return res.status(500).json({
      error: (error as Error).message
    })
  }
}
