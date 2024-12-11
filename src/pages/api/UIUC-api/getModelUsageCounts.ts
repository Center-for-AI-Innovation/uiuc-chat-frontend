import { type NextRequest, NextResponse } from 'next/server'

interface ModelUsage {
  model_name: string
  count: number
  percentage: number
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
    console.log('Making request to backend for project:', project_name)
    const response = await fetch(
      `https://flask-pr-319.up.railway.app/getModelUsageCounts?project_name=${project_name}`,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response not OK:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const data = (await response.json()) as ModelUsage[]
    console.log('Successfully received data from backend:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in handler:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch model usage counts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function remains the same
export async function getModelUsageCounts(project_name: string) {
  try {
    console.log('Fetching model usage counts for project:', project_name)
    const response = await fetch(
      `/api/UIUC-api/getModelUsageCounts?project_name=${project_name}`,
    )

    if (!response.ok) {
      console.error('Response not OK:', response.status, await response.text())
      return {
        status: response.status,
        data: [] as ModelUsage[],
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    console.log('Successfully fetched model usage data:', data)
    return {
      status: 200,
      data: data as ModelUsage[],
    }
  } catch (error) {
    console.error('Error in getModelUsageCounts:', error)
    return {
      status: 500,
      data: [] as ModelUsage[],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load model usage data',
    }
  }
}
