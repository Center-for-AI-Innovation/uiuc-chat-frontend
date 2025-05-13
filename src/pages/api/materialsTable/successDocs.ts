import type { NextApiRequest, NextApiResponse } from 'next'
import { db, documents } from '~/db/dbClient'
import { eq } from 'drizzle-orm'
// This is for "Documents" table, completed docs.

type SuccessDocsResponse = {
  documents?: { readable_filename: string }[]
  apiKey?: null
  error?: string
}

export default async function successDocs(
  req: NextApiRequest,
  res: NextApiResponse<SuccessDocsResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const course_name = req.query.course_name as string

  try {
    const data = await db
      .select({ readable_filename: documents.readable_filename, base_url: documents.base_url, url: documents.url })
      .from(documents)
      .where(eq(documents.course_name, course_name))

    if (!data || data.length === 0) {
      return res.status(200).json({ documents: [] })
    }

    if (data && data.length > 0) {
      return res.status(200).json({ documents: data.map((doc) => ({ 
        readable_filename: doc.readable_filename || '', 
        base_url: doc.base_url || '', 
        url: doc.url || ''
      })) })
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
