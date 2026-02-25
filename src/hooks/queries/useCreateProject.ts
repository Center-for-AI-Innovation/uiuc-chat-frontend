// Mutation: Creates a new project/course. Invalidates course names and existence caches on success.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProject } from '@/hooks/__internal__/createProject'
import { mutationKeys, queryKeys } from './keys'

export interface CreateProjectParams {
  project_name: string
  project_description: string | undefined
  project_owner_email: string
  is_private?: boolean
}

export { createProject }

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: mutationKeys.createProject(),
    mutationFn: async ({
      project_name,
      project_description,
      project_owner_email,
      is_private = false,
    }: CreateProjectParams) => {
      return createProject(
        project_name,
        project_description,
        project_owner_email,
        is_private,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allCourseNames() })
      queryClient.invalidateQueries({ queryKey: queryKeys.courseExists() })
    },
  })
}
