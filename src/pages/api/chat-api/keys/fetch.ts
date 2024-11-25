// src/pages/api/chat-api/keys/fetch.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'

export const config = {
  runtime: 'edge',
}

export default async function fetchKey(req: NextRequest, res: NextResponse) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const currUserId = await getAuth(req).userId
  if (!currUserId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
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
      return NextResponse.json({ apiKey: null }, { status: 200 })
    }

    if (data && data.length > 0) {
      console.log('API key found for user')
      return NextResponse.json({ apiKey: data[0]?.key }, { status: 200 })
    }
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}
