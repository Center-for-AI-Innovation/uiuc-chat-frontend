import { useQuery } from '@tanstack/react-query'
import { fetchCourseMetadata } from '../__internal__/fetchCourseMetadata'
import { type UseFetchCourseMetadataOptions } from './types'

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
