import { supabase } from '@/utils/supabaseClient'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function getApiKeyByCourseName(
  req: NextRequest,
  res: NextResponse,
) {
  const requestBody = await req.json()

  const { course_name } = requestBody

  const { data, error } = await supabase
    .from('projects')
    .select('n8n_api_key')
    .eq('course_name', course_name)
  // console.log('data from apifromsupa:', data)
  if (error) {
    console.error('Error: ', error)
    return new NextResponse(JSON.stringify({ success: false, error: error }), {
      status: 500,
    })
  }
  return new NextResponse(JSON.stringify({ success: true, api_key: data }), {
    status: 200,
  })
}
