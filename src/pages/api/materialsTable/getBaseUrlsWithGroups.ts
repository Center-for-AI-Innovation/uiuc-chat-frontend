import { type NextApiRequest, type NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { course_name } = req.query
  console.log('Fetching base URLs for course:', course_name)

  if (!course_name) {
    console.warn('Course name is missing in request')
    return res.status(400).json({ message: 'Course name is required' })
  }

  try {
    console.log('Calling Supabase RPC get_base_url_with_doc_groups...')
    const { data, error } = await supabase.rpc('get_base_url_with_doc_groups', {
      p_course_name: course_name,
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      throw error
    }

    console.log('Successfully fetched base URLs:', {
      baseUrlCount: data ? Object.keys(data).length : 0,
      data,
    })

    return res.status(200).json({ data })
  } catch (error: any) {
    console.error('Error fetching base URLs:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return res.status(500).json({
      message: 'Failed to fetch base URLs',
      error: error.message,
      details: error.details,
    })
  }
}
