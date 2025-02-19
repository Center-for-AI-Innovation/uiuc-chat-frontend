import { type NextApiRequest, type NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import { type MetadataRun } from '~/types/metadata'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { course_name } = req.query

  if (!course_name) {
    return res.status(400).json({ error: 'Course name is required' })
  }

  try {
    // First get the document IDs for the course
    const { data: documents, error: docError } = await supabase
      .from('cedar_documents')
      .select('id')
      .eq('course_name', course_name)

    if (docError) {
      console.error('Error fetching document IDs:', docError)
      return res.status(500).json({ error: 'Failed to fetch documents' })
    }

    const documentIds = documents.map((doc) => doc.id)

    // Get distinct runs with their metadata from cedar_runs table
    const { data: runs, error: runsError } = await supabase
      .from('cedar_runs')
      .select('run_id, created_at, prompt, run_status, document_id')
      .in('document_id', documentIds)
      .order('created_at', { ascending: false })

    if (runsError) {
      console.error('Error fetching runs:', runsError)
      return res.status(500).json({ error: 'Failed to fetch history' })
    }

    // Group runs by run_id
    const groupedRuns = runs.reduce((acc: { [key: string]: any }, run) => {
      if (!acc[run.run_id]) {
        acc[run.run_id] = {
          run_id: run.run_id,
          timestamp: run.created_at,
          prompt: run.prompt,
          status: 'completed', // Default to completed
          document_ids: [],
          document_count: 0,
        }
      }
      if (!acc[run.run_id].document_ids.includes(run.document_id)) {
        acc[run.run_id].document_ids.push(run.document_id)
        acc[run.run_id].document_count++
      }
      // If any document is in progress, the whole run is in progress
      if (run.run_status === 'in_progress') {
        acc[run.run_id].status = 'in_progress'
      }
      // If no document is in progress and any document failed, the run is failed
      else if (
        run.run_status === 'failed' &&
        acc[run.run_id].status !== 'in_progress'
      ) {
        acc[run.run_id].status = 'failed'
      }
      return acc
    }, {})

    const history: MetadataRun[] = Object.values(groupedRuns)
    // Sort by timestamp descending and limit to 50 runs
    const sortedHistory = history
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 50)

    return res.status(200).json({ history: sortedHistory })
  } catch (error) {
    console.error('Error in getMetadataHistory:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
