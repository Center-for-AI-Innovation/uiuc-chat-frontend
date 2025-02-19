// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
export const runtime = 'edge'

// TODO: look for public anon key for supabase
// Create a single supabase client for interacting with your database
// ~/src/pages/api/getSupabaseConfig.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SECRET = process.env.SUPABASE_SECRET as string

// Replace 'your_table' with the name of one of your tables
// try {
//   supabase.from('documents').select().single()
//     .then(response => {
//       if (response.error) {
//         console.error('Error:', response.error.message);
//       } else {
//         console.log('Connection successful');
//       }
//     })
// } catch (error) {
//   console.error('Unexpected error:', error);
// }

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET)

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

// export default async (req: any, res: any) => {
//   const course_name = req.nextUrl.searchParams.get('course_name')
//   const course_metadata = await getCourseDocuments(course_name)

//   try {
//     if (course_metadata == null) {
//       return NextResponse.json({
//         success: true,
//         course_metadata: null,
//         course_exists: false,
//       })
//     }

//     // Only parse is_private if it exists
//     if (course_metadata.hasOwnProperty('is_private')) {
//       course_metadata.is_private = JSON.parse(
//         course_metadata.is_private as unknown as string,
//       )
//     }
//     log.debug('getCourseMetadata() success', {
//       course_metadata: course_metadata,
//     })
//     return NextResponse.json({ course_metadata: course_metadata })
//   } catch (error) {
//     console.log('Error occurred while fetching courseMetadata', error)
//     log.error('Error occurred while fetching courseMetadata', { error: error })
//     return NextResponse.json({ success: false, error: error })
//   }
// }

// const getCourseMetadata = async (req: any, res: any) => {
//   const course_name = req.nextUrl.searchParams.get('course_name')
//   log.debug('getCourseMetadata() request', { course_name: course_name })
//   try {
//     const course_metadata = (await redisClient.hget(
//       'course_metadatas',
//       course_name,
//     )) as CourseMetadata
//     // console.log('in api getCourseMetadata: course_metadata', course_metadata)

//     if (course_metadata == null) {
//       return NextResponse.json({
//         success: true,
//         course_metadata: null,
//         course_exists: false,
//       })
//     }

//     // Only parse is_private if it exists
//     if (course_metadata.hasOwnProperty('is_private')) {
//       course_metadata.is_private = JSON.parse(
//         course_metadata.is_private as unknown as string,
//       )
//     }
//     log.debug('getCourseMetadata() success', {
//       course_metadata: course_metadata,
//     })
//     return NextResponse.json({ course_metadata: course_metadata })
//   } catch (error) {
//     console.log('Error occurred while fetching courseMetadata', error)
//     log.error('Error occurred while fetching courseMetadata', { error: error })
//     return NextResponse.json({ success: false, error: error })
//   }
// }

// export default getCourseMetadata
