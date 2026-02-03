import { useQuery } from '@tanstack/react-query'
import { type CourseMetadata } from '~/types/courseMetadata'

async function fetchAllCourseMetadata(
  currUserEmail: string,
): Promise<{ [key: string]: CourseMetadata }[]> {
  const response = await fetch(
    `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch all course metadata')
  }
  return response.json()
}

export function useFetchAllCourseMetadata({
  currUserEmail,
  enabled = true,
}: {
  currUserEmail: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['allCourseMetadata', currUserEmail],
    queryFn: () => fetchAllCourseMetadata(currUserEmail),
    enabled: enabled && Boolean(currUserEmail),
  })
}
