// ingest.ts
import { type NextApiRequest, type NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { course_name } = req.query as { course_name: string }

  // getApiFromCourse if api_key is not provided
  const { data, error } = await supabase
    .from('projects')
    .select('n8n_api_key')
    .eq('course_name', course_name)
    .single()

  if (error) {
    return res.status(500).json({ error: error })
  }
  if (!data) {
    return res
      .status(404)
      .json({ error: 'No N8n API keys found for your project.' })
  }
  return res.status(200).json(data.n8n_api_key)
}
export default handler
