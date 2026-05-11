import { useQuery } from '@tanstack/react-query'
import { type CourseMetadata } from '~/types/courseMetadata'
import { getBaseUrl } from '~/utils/apiUtils'

interface FetchCourseMetadataVariables {
  courseName: string
}

interface UseFetchCourseMetadataOptions extends FetchCourseMetadataVariables {
  enabled?: boolean
}

interface CourseMetadataResponse {
  courseMetadata: CourseMetadata
  lastAccessedAt: string | null
}

async function fetchCourseMetadata({
  courseName,
}: FetchCourseMetadataVariables): Promise<CourseMetadataResponse> {
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

  return {
    courseMetadata: data.course_metadata as CourseMetadata,
    lastAccessedAt: data.last_accessed_at ?? null,
  }
}

export function useFetchCourseMetadata({
  courseName,
  enabled = true,
}: UseFetchCourseMetadataOptions) {
  const query = useQuery({
    queryKey: ['courseMetadata', courseName],
    queryFn: () => fetchCourseMetadata({ courseName }),
    retry: 1,
    enabled: enabled && Boolean(courseName),
  })

  return {
    ...query,
    // Preserve backward compatibility: `data` returns CourseMetadata directly
    data: query.data?.courseMetadata,
    lastAccessedAt: query.data?.lastAccessedAt ?? null,
  }
}
