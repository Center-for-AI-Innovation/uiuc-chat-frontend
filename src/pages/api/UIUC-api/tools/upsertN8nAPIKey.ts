import { supabase } from '@/utils/supabaseClient'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest, res: NextResponse) {
  const requestBody = await req.json()
  // console.log('upsertN8nAPIKey course_name and n8n_api_key:', requestBody)
  const { course_name, n8n_api_key } = requestBody
  if (!course_name) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'course_name is required',
      }),
      { status: 400 },
    )
  }
  const { data, error } = await supabase
    .from('projects')
    .upsert(
      {
        n8n_api_key: n8n_api_key,
        course_name: course_name,
      },
      {
        onConflict: 'course_name',
      },
    )
    .eq('course_name', course_name)
    .select()
  // console.log('upsertN8nAPIKey data:', data)

  if (error) {
    console.error('Error upserting N8n key to Supabase:', error)
    return new NextResponse(JSON.stringify({ success: false, error: error }), {
      status: 500,
    })
  }
  return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
}
