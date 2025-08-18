import { eq } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db, documentsInProgress } from '~/db/dbClient'

// This is for "Documents in Progress" table, docs that are still being ingested.

type DocsInProgressResponse = {
  documents?: { readable_filename: string }[]
  apiKey?: null
  error?: string
}

export default async function docsInProgress(
  req: NextApiRequest,
  res: NextApiResponse<DocsInProgressResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const course_name = req.query.course_name as string

  try {
    const data = await db
      .select()
      .from(documentsInProgress)
      .where(eq(documentsInProgress.course_name, course_name))

    // No need to check for error here as the query doesn't return an error object
    // The try/catch block below will handle any errors that occur

    if (!data || data.length === 0) {
      return res.status(200).json({ documents: [] })
    }

    if (data && data.length > 0) {
      return res.status(200).json({
        documents: data.map(doc => ({
          readable_filename: doc.readable_filename || 'Untitled Document'
        }))
      })
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
