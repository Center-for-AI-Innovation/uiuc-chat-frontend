// Mutation: Toggles a document group's enabled/disabled status with optimistic cache updates and rollback.
import { type QueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { type DocumentGroup } from '~/types/courseMaterials'

export function useUpdateDocGroup(
  course_name: string,
  queryClient: QueryClient,
) {
  const auth = useAuth()
  const userId = auth.user?.profile.sub
  return useMutation({
    mutationFn: async ({
      doc_group_obj,
      enabled,
    }: {
      doc_group_obj: DocumentGroup
      enabled: boolean
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDocGroupStatus',
          courseName: course_name,
          docGroup: doc_group_obj.name,
          enabled: enabled,
          userId,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update document group status')
      }
      return response.json()
    },
    // Optimistically update the cache
    onMutate: async ({ doc_group_obj, enabled }) => {
      await queryClient.cancelQueries({
        queryKey: ['documentGroups', course_name],
      })
      const previousDocumentGroups = queryClient.getQueryData([
        'documentGroups',
        course_name,
      ])
      queryClient.setQueryData(
        ['documentGroups', course_name],
        (old: DocumentGroup[] | undefined) => {
          // Perform the optimistic update
          return old?.map((docGroup) => {
            if (docGroup.name === doc_group_obj.name) {
              return { ...docGroup, enabled }
            }
            return docGroup
          })
        },
      )
      return { previousDocumentGroups }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['documentGroups', course_name],
        context?.previousDocumentGroups,
      )
    },
    onSettled: () => {
      // Refetch after mutation or error
      queryClient.invalidateQueries({
        queryKey: ['documentGroups', course_name],
      })
    },
  })
}
