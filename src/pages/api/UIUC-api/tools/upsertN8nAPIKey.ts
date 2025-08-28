import { supabase } from '@/utils/supabaseClient'
import { type NextApiRequest, type NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { course_name, n8n_api_key } = req.body
  // console.log('upsertN8nAPIKey course_name and n8n_api_key:', req.body)
  
  if (!course_name) {
    return res.status(400).json({
      success: false,
      error: 'course_name is required',
    })
  }

  const { data, error } = await supabase
    .from('projects')
    .upsert(
      {
        n8n_api_key: n8n_api_key,
        course_name: course_name,
      },
      {
        onConflict: 'course_name',
      },
    )
    .eq('course_name', course_name)
    .select()
  // console.log('upsertN8nAPIKey data:', data)

  if (error) {
    console.error('Error upserting N8n key to Supabase:', error)
    return res.status(500).json({ success: false, error: error })
  }
  
  return res.status(200).json({ success: true })
}
