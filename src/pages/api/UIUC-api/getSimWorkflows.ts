import { type NextApiRequest, type NextApiResponse } from 'next'
import { type SimWorkflow } from '~/types/sim'

/**
 * API route to get Sim workflows
 * Note: Sim API doesn't provide a GET endpoint for workflow metadata.
 * Workflow metadata is stored in localStorage on the client side.
 * 
 * GET /api/UIUC-api/getSimWorkflows
 * Query params:
 *   - course_name: The course name (optional, for DB lookup)
 *   - api_key: The Sim API key
 *   - workflow_ids: Comma-separated workflow IDs to return
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name, api_key, workflow_ids } = req.query

  // Get API key from query params or fall back to env vars
  let simApiKey = typeof api_key === 'string' ? api_key : null
  if (!simApiKey) {
    simApiKey = process.env.NEXT_PUBLIC_SIM_API_KEY || process.env.SIM_API_KEY || null
  }

  // Get workflow IDs from query params
  const simWorkflowIds = typeof workflow_ids === 'string' ? workflow_ids : null

  if (!simApiKey) {
    return res.status(200).json({ workflows: [], message: 'Sim API key not provided' })
  }

  if (!simWorkflowIds) {
    return res.status(200).json({ workflows: [], message: 'No workflow IDs provided' })
  }

  try {
    // Parse workflow IDs
    const workflowIdList = simWorkflowIds.split(',').map(id => id.trim()).filter(Boolean)
    
    if (workflowIdList.length === 0) {
      return res.status(200).json({ workflows: [] })
    }

    // Create workflow objects with default names
    // Metadata will be merged on the client side from localStorage
    const workflows: SimWorkflow[] = workflowIdList.map(id => ({
      id,
      name: `Workflow ${id.substring(0, 8)}...`,
      description: 'Sim workflow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    console.log(`Returning ${workflows.length} Sim workflows with metadata`)
    return res.status(200).json({ workflows })
  } catch (error) {
    console.error('Error processing Sim workflows:', error)
    return res.status(500).json({
      error: 'Internal server error while processing Sim workflows',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
