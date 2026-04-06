import { type NextApiRequest, type NextApiResponse } from 'next'

/**
 * GET /api/UIUC-api/tools/getSimConfig?course_name=X
 *
 * Stub: Sim config is stored in localStorage for testing.
 * When DB columns are added, this will read from the projects table.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    sim_api_key: null,
    sim_base_url: null,
    sim_workspace_id: null,
  })
}
