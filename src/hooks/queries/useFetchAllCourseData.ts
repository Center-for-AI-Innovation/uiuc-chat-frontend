// Query: Fetches all data for a course including distinct uploaded files.
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './keys'

export interface AllCourseDataResponse {
  distinct_files: any
}

async function fetchAllCourseData(
  courseName: string,
): Promise<AllCourseDataResponse> {
  const response = await fetch(
    `/api/UIUC-api/getAllCourseData?course_name=${courseName}`,
  )

  if (!response.ok) {
    console.error('Error fetching course data:', response.status)
    throw new Error(`Error fetching course data: ${response.status}`)
  }

  return response.json()
}

export function useFetchAllCourseData({
  courseName,
  enabled = true,
}: {
  courseName: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.allCourseData(courseName),
    queryFn: () => fetchAllCourseData(courseName),
    enabled: enabled && Boolean(courseName),
  })
}
