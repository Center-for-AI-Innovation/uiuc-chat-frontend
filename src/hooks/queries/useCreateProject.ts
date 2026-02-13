import { useMutation } from '@tanstack/react-query'
import { createProject } from '@/hooks/__internal__/createProject'

export { createProject }

interface CreateProjectParams {
  project_name: string
  project_description: string | undefined
  project_owner_email: string
  is_private?: boolean
}

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
