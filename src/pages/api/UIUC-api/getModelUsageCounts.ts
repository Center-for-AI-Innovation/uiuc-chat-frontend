import { type NextRequest, NextResponse } from 'next/server'

interface ModelUsage {
  model_name: string
  count: number
  percentage: number
}

interface RawModelUsage {
  [key: string]: number
}

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  const project_name = req.nextUrl.searchParams.get('project_name')

  if (!project_name) {
    return NextResponse.json(
      { error: 'Missing required project_name parameter' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(
      `https://flask-pr-319.up.railway.app/getModelUsageCounts?project_name=${project_name}`,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.statusText}` },
        { status: response.status },
      )
    }

    const rawData = (await response.json()) as RawModelUsage

    // Calculate total count with proper typing
    const totalCount = Object.values(rawData).reduce(
      (acc, curr) => acc + curr,
      0,
    )

    // Transform data to include percentages
    const data: ModelUsage[] = Object.entries(rawData).map(
      ([model_name, count]) => ({
        model_name,
        count,
        percentage: (count / totalCount) * 100,
      }),
    )

    console.log('Fetched model usage counts data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching model usage counts:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch model usage counts',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// Add helper function to get model usage counts from frontend
export async function getModelUsageCounts(project_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getModelUsageCounts?project_name=${project_name}`,
    )

    if (!response.ok) {
      return {
        status: response.status,
        data: [] as ModelUsage[],
      }
    }

    const data = await response.json()
    return {
      status: 200,
      data: data as ModelUsage[],
    }
  } catch (error) {
    console.error('Error in getModelUsageCounts:', error)
    return {
      status: 500,
      data: [] as ModelUsage[],
    }
  }
}
