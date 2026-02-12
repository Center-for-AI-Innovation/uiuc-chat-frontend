import { useQuery } from '@tanstack/react-query'
import { fetchCourseMetadata } from '../__internal__/fetchCourseMetadata'

export interface FetchCourseMetadataVariables {
  courseName: string
}

export interface UseFetchCourseMetadataOptions
  extends FetchCourseMetadataVariables {
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
