// src/pages/api/chat-api/keys/fetch.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'

type ApiResponse = {
  apiKey?: string | null
  error?: string
}

export default async function fetchKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = getAuth(req)
  const currUserId = auth.userId
  if (!currUserId) {
    return res.status(401).json({ error: 'User ID is required' })
  }

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('user_id', currUserId)
      .eq('is_active', true)

    // console.log('data', data)

    if (error) {
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
