import { type NextApiRequest, type NextApiResponse } from 'next'

/**
 * POST /api/UIUC-api/tools/upsertSimConfig
 *
 * Stub: Sim config is stored in localStorage for testing.
 * When DB columns are added, this will persist to the projects table.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ success: true })
}
