// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

export const getCourseMetadata = async (
  course_name: string,
): Promise<CourseMetadata | null> => {
  try {
    const course_metadata = (await kv.hget(
      'course_metadatas',
      course_name,
    )) as CourseMetadata
    // console.log('in direct course name', course_name)
    // console.log('In DIRECT course metadata', course_metadata)
    return course_metadata
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export default async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')
  const course_metadata = await getCourseMetadata(course_name)

  try {
    if (course_metadata == null) {
      return NextResponse.json({
        success: true,
        course_metadata: null,
        course_exists: false,
      })
    }

    // Only parse is_private if it exists
    if (course_metadata.hasOwnProperty('is_private')) {
      course_metadata.is_private = JSON.parse(
        course_metadata.is_private as unknown as string,
      )
    }
    // log.debug('getCourseMetadata() success', {
    //   course_metadata: course_metadata,
    // })
    return NextResponse.json({ course_metadata: course_metadata })
  } catch (error) {
    console.log('Error occurred while fetching courseMetadata', error)
    return NextResponse.json({ success: false, error: error })
  }
}

// const getCourseMetadata = async (req: any, res: any) => {
//   const course_name = req.nextUrl.searchParams.get('course_name')
//   log.debug('getCourseMetadata() request', { course_name: course_name })
//   try {
//     const course_metadata = (await kv.hget(
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
