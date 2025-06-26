import { eq } from 'drizzle-orm'
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/db/dbClient'
import { documents } from '~/db/schema'

export const runtime = 'edge'

export const getCourseDocumentsHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const { fileName, courseNameFromBody } = req.body as {
    fileName: string
    courseNameFromBody: string
  }

  // Ensure courseNameFromBody is provided
  if (!courseNameFromBody) {
    return res
      .status(400)
      .json({ error: 'Course name is missing in request body' })
  }

  const documents = await getCourseDocuments(courseNameFromBody)

  if (documents === null) {
    return res.status(500).json({ error: 'Error fetching course documents' })
  }

  return res.status(200).json(documents)
}

interface CourseDocuments {
  readable_filename: string
  url: string
  s3_path: string
  created_at: string
  base_url: string
}

export const getCourseDocuments = async (
  course_name: string,
): Promise<CourseDocuments[] | null> => {
  if (!course_name) {
    console.error('Course name is missing')
    return null
  }
  try {
    const data = await db
      .select({ readable_filename: documents.readable_filename, url: documents.url, s3_path: documents.s3_path, created_at: documents.created_at, base_url: documents.base_url })
      .from(documents)
      .where(eq(documents.course_name, course_name))

    if (data.length === 0) {
      console.error('No documents found for course:', course_name)
      return null
    }

    return data.map((doc) => ({
      readable_filename: doc.readable_filename || '',
      url: doc.url || '',
      s3_path: doc.s3_path || '',
      created_at: doc.created_at?.toISOString() || '',
      base_url: doc.base_url || '',
    }))
  } catch (error) {
    console.error(
      'Unexpected error occurred while fetching course documents:',
      error,
    )
    return null
  }
}
