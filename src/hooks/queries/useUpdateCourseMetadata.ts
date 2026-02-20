// Mutation: Updates course metadata (settings, banner, description, etc.). Invalidates related course caches on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata } from '@/hooks/__internal__/setCourseMetadata'
import { mutationKeys, queryKeys } from './keys'

export function useUpdateCourseMetadata(courseName: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: mutationKeys.setCourseMetadata(courseName),
    mutationFn: async (
      courseMetadata: CourseMetadata | CourseMetadataOptionalForUpsert,
    ) => {
      const success = await callSetCourseMetadata(courseName, courseMetadata)
      if (!success) {
        throw new Error('Failed to update course metadata')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseMetadata(courseName),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.allCourseMetadata(),
      })
    },
    onError: (error) => {
      console.error('Error setting course metadata:', error)
    },
  })
}
