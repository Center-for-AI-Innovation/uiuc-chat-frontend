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
    const { course_name } = req.query

    if (!course_name || typeof course_name !== 'string') {
      return res.status(400).json({ error: 'Invalid course_name parameter' })
    }

    // Get documents that are ready for metadata generation
    const { data, error } = await supabase
      .from('cedar_documents')
      .select('id, readable_filename, metadata_status')
      .eq('course_name', course_name)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error getting metadata documents:', error)
    return res.status(500).json({ error: 'Failed to get metadata documents' })
  }
}
