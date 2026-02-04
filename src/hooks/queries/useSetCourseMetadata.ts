import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata } from '@/hooks/__internal__/setCourseMetadata'

export function useSetCourseMetadata(courseName: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ['setCourseMetadata', courseName],
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
        queryKey: ['courseMetadata', courseName],
      })
    },
    onError: (error) => {
      console.error('Error setting course metadata:', error)
    },
  })
}
