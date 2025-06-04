import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

export const runtime = 'edge'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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
    const { data: documents, error } = await supabase
      .from('documents')
      .select('readable_filename,url,s3_path,created_at,base_url')
      .eq('course_name', course_name)

    if (error) {
      console.error('Error fetching course documents:', error)
      return null
    }

    return documents
  } catch (error) {
    console.error(
      'Unexpected error occurred while fetching course documents:',
      error,
    )
    return null
  }
}

export default handler
