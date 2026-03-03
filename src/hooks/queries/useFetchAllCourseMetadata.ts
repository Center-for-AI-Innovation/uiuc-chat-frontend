import { useQuery } from '@tanstack/react-query'
import { type CourseMetadata } from '~/types/courseMetadata'

export type CourseWithMetadata = {
  course_name: string
  metadata: CourseMetadata
}

async function fetchAllCourseMetadata(): Promise<CourseWithMetadata[]> {
  const response = await fetch('/api/UIUC-api/getAllCourseMetadata')

  if (!response.ok) {
    throw new Error(`Error fetching course metadata: ${response.status}`)
  }

  const data: { [key: string]: CourseMetadata }[] = await response.json()

  return data.map((entry) => {
    const courseName = Object.keys(entry)[0]!
    const metadata = entry[courseName]!

    // Ensure is_private is boolean (may come as string from Redis)
    if (typeof metadata.is_private === 'string') {
      metadata.is_private =
        (metadata.is_private as unknown as string).toLowerCase() === 'true'
    }

    return { course_name: courseName, metadata }
  })
}

export function useFetchAllCourseMetadata({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['allCourseMetadata'],
    queryFn: fetchAllCourseMetadata,
    retry: 1,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
