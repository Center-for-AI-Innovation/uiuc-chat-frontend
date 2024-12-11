import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest) {
  const project_name = req.nextUrl.searchParams.get('project_name')

  if (!project_name) {
    return NextResponse.json(
      { error: 'Missing required project_name parameter' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(
      `https://flask-production-751b.up.railway.app/getWeeklyTrends?project_name=${project_name}`,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log('Fetched weekly trends data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching weekly trends:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch weekly trends',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

interface WeeklyTrend {
  current_week_value: number
  metric_name: string
  percentage_change: number
  previous_week_value: number
}

export async function getWeeklyTrends(project_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getWeeklyTrends?project_name=${project_name}`,
    )

    if (!response.ok) {
      return {
        status: response.status,
        data: [] as WeeklyTrend[],
      }
    }

    const data = await response.json()
    console.log('Fetched weekly trends data:', data)
    return {
      status: 200,
      data: data,
    }
  } catch (error) {
    console.error('Error in getWeeklyTrends:', error)
    return {
      status: 500,
      data: [] as WeeklyTrend[],
    }
  }
}
