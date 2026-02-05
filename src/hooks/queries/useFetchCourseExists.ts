import { useQuery } from '@tanstack/react-query'

interface FetchCourseExistsVariables {
  courseName: string
}

interface UseFetchCourseExistsOptions extends FetchCourseExistsVariables {
  enabled?: boolean
}

interface CourseExistsResponse {
  exists: boolean
}

async function fetchCourseExists({
  courseName,
}: FetchCourseExistsVariables): Promise<boolean> {
  const response = await fetch(
    `/api/UIUC-api/getCourseExists?course_name=${courseName}`,
  )

  if (!response.ok) {
    throw new Error(`Error checking if course exists: ${response.status}`)
  }

  const data: CourseExistsResponse = await response.json()
  return Boolean(data.exists)
}

export function useFetchCourseExists({
  courseName,
  enabled = true,
}: UseFetchCourseExistsOptions) {
  return useQuery({
    queryKey: ['courseExists', courseName],
    queryFn: () => fetchCourseExists({ courseName }),
    retry: 1,
    enabled: enabled && Boolean(courseName),
  })
}
