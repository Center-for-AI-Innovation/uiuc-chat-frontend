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
      `https://flask-pr-319.up.railway.app/getConversationHeatmapByHour?course_name=${course_name}`,
    )

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
