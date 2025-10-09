import { withAuth } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

interface ModelUsage {
  model_name: string
  count: number
  percentage: number
}

export default withCourseOwnerOrAdminAccess()(handler)

async function handler(req: any, res: any) {
  const { project_name } = req.body

  if (!project_name) {
    return res
      .status(400)
      .json({ error: 'Missing required project_name parameter' })
  }

  try {
    const response = await fetch(
      `${getBackendUrl()}/getModelUsageCounts?project_name=${project_name}`,
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response not OK:', response.status, errorText)
      return res.status(response.status).json({
        error: `Failed to fetch data: ${response.status} - ${errorText}`,
      })
    }

    const data = (await response.json()) as ModelUsage[]
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error in handler:', error)
    return res.status(500).json({
      error: 'Failed to fetch model usage counts',
      details: error instanceof Error ? error.message : String(error),
    })
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
