// Mutation: Creates a new document group with optimistic cache updates and rollback on error.
import { type QueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import {
  type DocumentGroup,
  type CourseDocument,
} from '~/types/courseMaterials'

export function useCreateDocumentGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  const auth = useAuth()
  const userId = auth.user?.profile.sub

  return useMutation({
    mutationFn: async ({ doc_group_name }: { doc_group_name: string }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createDocGroup',
          courseName: course_name,
          docGroup: doc_group_name,
          userId,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create document group')
      }
      return response.json()
    },
    onMutate: async ({ doc_group_name }) => {
      await queryClient.cancelQueries({
        queryKey: ['documentGroups', course_name],
      })
      await queryClient.cancelQueries({ queryKey: ['documents', course_name] })
      const previousDocumentGroups = queryClient.getQueryData<DocumentGroup[]>([
        'documentGroups',
        course_name,
      ])

      queryClient.setQueryData(
        ['documentGroups', course_name],
        (old: DocumentGroup[] | undefined) => {
          // Perform the optimistic update
          return [
            ...(old || []),
            {
              name: doc_group_name,
              enabled: true,
              doc_count: 1,
              course_name: course_name,
            },
          ]
        },
      )

      const previousDocuments = queryClient.getQueryData([
        'documents',
        course_name,
        page,
      ])
      queryClient.setQueryData(
        ['documents', course_name, page],
        (
          old:
            | { final_docs: CourseDocument[]; total_count: number }
            | undefined,
        ) => {
          if (!old) return
          // Perform the optimistic update
          const updatedDocuments = old?.final_docs.map((doc) => {
            return {
              ...doc,
              doc_groups: [...(doc.doc_groups || []), doc_group_name],
            }
          })
          return {
            ...old,
            final_docs: updatedDocuments,
          }
        },
      )

      return { previousDocumentGroups, previousDocuments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['documentGroups', course_name],
        context?.previousDocumentGroups,
      )
      queryClient.setQueryData(
        ['documents', course_name, page],
        context?.previousDocuments,
      )
    },
    onSettled: () => {
      // Refetch after mutation or error
      queryClient.invalidateQueries({
        queryKey: ['documentGroups', course_name],
      })
      queryClient.invalidateQueries({ queryKey: ['documents', course_name] })
    },
  })
}
