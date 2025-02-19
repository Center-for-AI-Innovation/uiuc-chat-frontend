import { type NextApiRequest, type NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { run_id } = req.query

    if (!run_id || typeof run_id !== 'string') {
      return res.status(400).json({ error: 'Invalid run_id parameter' })
    }

    // Get metadata fields from Supabase
    const { data, error } = await supabase
      .from('cedar_document_metadata')
      .select(
        `
        id,
        document_id,
        field_name,
        field_value,
        confidence_score,
        extraction_method,
        created_at
      `,
      )
      .eq('run_id', run_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching metadata fields:', error)
      throw error
    }

    // Transform confidence scores from decimal to percentage if needed
    const transformedData = data.map((field) => ({
      ...field,
      confidence_score:
        field.confidence_score !== null
          ? field.confidence_score * 100 // Convert decimal to percentage
          : null,
    }))

    return res.status(200).json({ metadata: transformedData })
  } catch (error) {
    console.error('Error getting metadata fields:', error)
    return res.status(500).json({ error: 'Failed to get metadata fields' })
  }
}
