import { useMutation } from '@tanstack/react-query'
import { createProject } from '@/hooks/__internal__/createProject'
import { type CreateProjectParams } from './types'

export { createProject }

export function useCreateProjectMutation() {
  return useMutation({
    mutationKey: ['createProject'],
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
  })
}
