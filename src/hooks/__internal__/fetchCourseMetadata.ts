import { type CourseMetadata } from '~/types/courseMetadata'
import { getBaseUrl } from '~/utils/apiUtils'

export async function fetchCourseMetadata({
  courseName,
}: {
  courseName: string
}): Promise<CourseMetadata> {
  const endpoint = `${getBaseUrl()}/api/UIUC-api/getCourseMetadata?course_name=${courseName}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(
      `Error fetching course metadata: ${response.statusText || response.status}`,
    )
  }

  const data = await response.json()
  if (data.success === false) {
    throw new Error(
      data.message || 'An error occurred while fetching course metadata',
    )
  }

  // Parse is_private if it's a string
  if (
    data.course_metadata &&
    typeof data.course_metadata.is_private === 'string'
  ) {
    data.course_metadata.is_private =
      data.course_metadata.is_private.toLowerCase() === 'true'
  }

  return data.course_metadata as CourseMetadata
}
