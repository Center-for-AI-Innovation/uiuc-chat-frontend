import { withAuth } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: any, res: any) {
  const { project_name } = req.body

  if (!project_name) {
    return res
      .status(400)
      .json({ error: 'Missing required project_name parameter' })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/getWeeklyTrends?project_name=${project_name}`,
    )

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch data: ${response.statusText}`,
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching weekly trends:', error)
    return res.status(500).json({
      error: 'Failed to fetch weekly trends',
      details: (error as Error).message,
    })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)

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
