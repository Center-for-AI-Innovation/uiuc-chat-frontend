// ~/src/pages/api/UIUC-api/getAllCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

export const getCoursesByOwnerOrAdmin = async (
  currUserEmail: string,
): Promise<{ [key: string]: CourseMetadata }[] | null> => {
  /*
  I return a list of dictionaries of course metadata where the currUserEmail is an owner or admin
    The key is the courseName
    The value is the CourseMetadata object
  */

  try {
    const all_course_metadata_raw = await kv.hgetall('course_metadatas')
    if (all_course_metadata_raw) {
      const all_course_metadata = Object.entries(all_course_metadata_raw)
        .map(([key, value]) => {
          const courseMetadata = value as CourseMetadata
          if (!courseMetadata) {
            console.error('Invalid course metadata:', value)
            return null
          }
          // Check if the current user is the course owner or a course admin
          if (
            courseMetadata.course_owner &&
            courseMetadata.course_admins &&
            (courseMetadata.course_owner === currUserEmail ||
              courseMetadata.course_admins.includes(currUserEmail))
          ) {
            return { [key]: courseMetadata }
          }
          // return null;
        })
        .filter(
          (item) =>
            item !== null && item !== undefined && Object.keys(item).length > 0,
        ) as { [key: string]: CourseMetadata }[]
      return all_course_metadata
    } else {
      console.error(
        'Error occurred while fetching courseMetadata: No course metadata found for ANY course!',
      )
      return null
    }
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export const getAllCourseMetadata = async (): Promise<
  { [key: string]: CourseMetadata }[] | null
> => {
  /*
  I return a list of dictionaries of course metadata
    The key is the courseName
    The value is the CourseMetadata object
  */

  try {
    const all_course_metadata_raw = await kv.hgetall('course_metadatas')

    if (all_course_metadata_raw) {
      const all_course_metadata = Object.entries(all_course_metadata_raw)
        .map(([key, value]) => {
          const courseMetadata = value as CourseMetadata
          if (!courseMetadata) {
            console.error('Invalid course metadata:', value)
            return null
          }
          return { [key]: courseMetadata }
        })
        .filter((item) => item !== null) as { [key: string]: CourseMetadata }[]
      return all_course_metadata
    } else {
      console.error(
        'Error occurred while fetching courseMetadata: No course metadata found for ANY course!',
      )
      return null
    }
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export default async (req: any, res: any) => {
  try {
    const currUserEmail = req.nextUrl.searchParams.get('currUserEmail')
    const all_course_metadata = await getCoursesByOwnerOrAdmin(currUserEmail)
    return NextResponse.json(all_course_metadata)
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return NextResponse.json({ success: false, error: error })
  }
}
