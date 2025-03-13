// src/pages/api/UIUC-api/getConversationStats.ts
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  const course_name = req.nextUrl.searchParams.get('course_name')
  const from_date = req.nextUrl.searchParams.get('from_date')
  const to_date = req.nextUrl.searchParams.get('to_date')

  if (!course_name) {
    return NextResponse.json(
      { error: 'Missing required course_name parameter' },
      { status: 400 },
    )
  }

  try {
    const url = new URL(
      'https://flask-production-751b.up.railway.app/getConversationStats',
    )
    url.searchParams.append('course_name', course_name)
    if (from_date) url.searchParams.append('from_date', from_date)
    if (to_date) url.searchParams.append('to_date', to_date)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching questions per day:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions per day' },
      { status: 500 },
    )
  }
}

export async function getConversationStats(
  course_name: string,
  from_date?: string,
  to_date?: string,
) {
  try {
    const url = new URL(
      '/api/UIUC-api/getConversationStats',
      window.location.origin,
    )
    url.searchParams.append('course_name', course_name)
    if (from_date) url.searchParams.append('from_date', from_date)
    if (to_date) url.searchParams.append('to_date', to_date)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }
    return {
      status: response.status,
      data: await response.json(),
    }
  } catch (error) {
    console.error('Error fetching conversation stats:', error)
    throw error
  }
}
