// src/pages/api/materialsTable/docsInProgress.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'

export const config = {
  runtime: 'edge',
}

export default async function docsInProgress(
  req: NextRequest,
  res: NextResponse,
) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const url = new URL(req.url)
  const course_name = url.searchParams.get('course_name')

  const currUserId = await getAuth(req).userId
  if (!currUserId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('documents_in_progress')
      .select('readable_filename')
      .eq('course_name', course_name)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ apiKey: null }, { status: 200 })
    }

    if (data && data.length > 0) {
      // console.log(data)
      return NextResponse.json({ documents: data }, { status: 200 })
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}
