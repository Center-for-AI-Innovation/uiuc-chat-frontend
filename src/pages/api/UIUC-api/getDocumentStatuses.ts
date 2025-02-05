import { type NextApiRequest, type NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import { type DocumentStatus } from '~/types/metadata'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { run_id, document_ids } = req.query

    if (!run_id) {
      return res.status(400).json({ error: 'run_id is required' })
    }

    // Get statuses from cedar_runs table
    let query = supabase
      .from('cedar_runs')
      .select('document_id, run_status, last_error')
      .eq('run_id', run_id)

    // If document_ids is provided, filter by them
    if (document_ids) {
      const documentIdsArray = (document_ids as string).split(',').map(Number)
      query = query.in('document_id', documentIdsArray)
    }

    const { data: runStatuses, error: runError } = await query

    if (runError) {
      console.error('Error fetching run statuses:', runError)
      throw runError
    }

    // Map the statuses to the expected format
    const statuses: DocumentStatus[] = runStatuses.map((status) => ({
      document_id: status.document_id,
      run_status:
        (status.run_status as 'in_progress' | 'completed' | 'failed') ||
        'in_progress',
      last_error: status.last_error,
    }))

    return res.status(200).json({ statuses })
  } catch (error) {
    console.error('Error getting document statuses:', error)
    return res.status(500).json({ error: 'Failed to get document statuses' })
  }
}
