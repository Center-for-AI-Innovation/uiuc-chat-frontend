import { db } from '~/db/dbClient'
import { NextRequest, NextResponse } from 'next/server'
import { projects } from '~/db/schema'


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
  try{
    const result = await db
      .insert(projects)
      .values({
        n8n_api_key: n8n_api_key,
        course_name: course_name,
      })
      .onConflictDoUpdate({
        target: [projects.course_name],
        set: {
          n8n_api_key: n8n_api_key,
        },
      })
    console.log('upsertN8nAPIKey result:', result)
    return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
  } catch (error: any) {
    console.error('Error upserting N8n key to Supabase:', error)
    return new NextResponse(JSON.stringify({ success: false, error: error }), {
      status: 500,
    })
  }

}
