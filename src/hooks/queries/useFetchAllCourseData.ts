// Query: Fetches all data for a course including distinct uploaded files.
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './keys'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = { [key: string]: JsonValue }

export interface AllCourseDataResponse {
  distinct_files: JsonObject[]
}

async function fetchAllCourseData(
  courseName: string,
): Promise<AllCourseDataResponse> {
  const response = await fetch(
    `/api/UIUC-api/getAllCourseData?course_name=${encodeURIComponent(courseName)}`,
  )

  if (!response.ok) {
    console.error('Error fetching course data:', response.status)
    throw new Error(`Error fetching course data: ${response.status}`)
  }

  return (await response.json()) as AllCourseDataResponse
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
