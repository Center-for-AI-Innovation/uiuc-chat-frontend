import { useQuery } from '@tanstack/react-query'
import { fetchCourseMetadata } from '../__internal__/fetchCourseMetadata'

interface FetchCourseMetadataVariables {
  courseName: string
}

interface UseFetchCourseMetadataOptions extends FetchCourseMetadataVariables {
  enabled?: boolean
}

export function useFetchCourseMetadata({
  courseName,
  enabled = true,
}: UseFetchCourseMetadataOptions) {
  return useQuery({
    queryKey: ['courseMetadata', courseName],
    queryFn: () => fetchCourseMetadata({ courseName }),
    retry: 1,
    enabled: enabled && Boolean(courseName),
  })
}
