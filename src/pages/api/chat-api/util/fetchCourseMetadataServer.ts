import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'

/**
 * Server-side function to fetch course metadata.
 * @param course_name The name of the course.
 * @returns The course metadata.
 */
export async function fetchCourseMetadataServer(
  course_name: string,
): Promise<any> {
  const course_metadata = await getCourseMetadata(course_name)

  if (course_metadata && typeof course_metadata.is_private === 'string') {
    course_metadata.is_private =
      course_metadata.is_private.toLowerCase() === 'true'
  }

  return course_metadata
}
