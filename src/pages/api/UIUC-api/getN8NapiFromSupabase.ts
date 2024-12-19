import { supabase } from '@/utils/supabaseClient'
import { NextApiRequest, NextApiResponse } from 'next'

type ApiResponse = {
  success: boolean
  api_key?: any
  error?: any
}

export default async function getApiKeyByCourseName(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { course_name } = req.body

  const { data, error } = await supabase
    .from('projects')
    .select('n8n_api_key')
    .eq('course_name', course_name)
  // console.log('data from apifromsupa:', data)
  if (error) {
    console.error('Error: ', error)
    return res.status(500).json({ success: false, error: error })
  }
  return res.status(200).json({ success: true, api_key: data })
}
