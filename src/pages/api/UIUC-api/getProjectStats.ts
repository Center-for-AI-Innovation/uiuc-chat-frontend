// src/pages/api/UIUC-api/getProjectStats.ts
import { type NextRequest, NextResponse } from 'next/server'

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
      `https://flask-production-751b.up.railway.app/getProjectStats?project_name=${project_name}`,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching project stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch project stats',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function getProjectStats(project_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getProjectStats?project_name=${project_name}`,
    )

    if (!response.ok) {
      return {
        status: response.status,
        data: {
          total_conversations: 0,
          total_messages: 0,
          unique_users: 0,
        },
      }
    }

    const data = await response.json()

    return {
      status: 200,
      data: {
        total_conversations: data.total_conversations || 0,
        total_messages: data.total_messages || 0,
        unique_users: data.unique_users || 0,
      },
    }
  } catch (error) {
    console.error('Error in getProjectStats:', error)
    return {
      status: 500,
      data: {
        total_conversations: 0,
        total_messages: 0,
        unique_users: 0,
      },
    }
  }
}
