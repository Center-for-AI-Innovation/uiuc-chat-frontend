// src/pages/api/UIUC-api/getCourseStats.ts
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  const course_name = req.nextUrl.searchParams.get('course_name')

  if (!course_name) {
    return NextResponse.json(
      { error: 'Missing required course_name parameter' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/getCourseStats?course_name=${course_name}`,
    )

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch course stats' },
      { status: 500 },
    )
  }
}

export async function getCourseStats(course_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getCourseStats?course_name=${course_name}`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }
    return {
      status: response.status,
      data: await response.json(),
    }
  } catch (error) {
    console.error('Error fetching course stats:', error)
    throw error
  }
}
