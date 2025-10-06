import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
import type { CourseMetadata } from '~/types/courseMetadata'

/**
 * Server-side function to fetch course metadata.
 * @param course_name The name of the course.
 * @returns The course metadata.
 */
export default async function fetchCourseMetadataServer(
  course_name: string,
): Promise<CourseMetadata | null> {
  const course_metadata = await getCourseMetadata(course_name)

  return course_metadata
}
