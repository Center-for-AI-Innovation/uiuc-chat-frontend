// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/db/dbClient'
import { projects } from '~/db/schema'
import { eq } from 'drizzle-orm'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { course_name } = req.query as { course_name: string }

  // getApiFromCourse if api_key is not provided
  try{
    const data = await db
      .select({ n8n_api_key: projects.n8n_api_key })
      .from(projects)
      .where(eq(projects.course_name, course_name))
      .limit(1)

    if (!data) {
      return res.status(500).json({ error: 'No N8n API keys found for your project.' })
    }
    return res.status(200).json(data[0]?.n8n_api_key)
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}

export default handler
