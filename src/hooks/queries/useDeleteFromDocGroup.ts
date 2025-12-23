import { type QueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import {
  type CourseDocument,
  type DocumentGroup,
} from '~/types/courseMaterials'

export function useDeleteFromDocGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  // USAGE:
  // removeFromDocGroup(course_name).mutate({
  //   record,
  //   removedGroup,
  // })
  const auth = useAuth()
  const userId = auth.user?.profile.sub
  return useMutation({
    mutationFn: async ({
      record,
      removedGroup,
    }: {
      record: CourseDocument
      removedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: removedGroup,
          userId,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove document group')
      }
      return response.json()
    },
    // Optimistically update the cache
    onMutate: async ({ record, removedGroup }) => {
      await queryClient.cancelQueries({
        queryKey: ['documentGroups', course_name],
      })
      await queryClient.cancelQueries({ queryKey: ['documents', course_name] })
      const previousDocumentGroups = queryClient.getQueryData([
        'documentGroups',
        course_name,
      ])
      queryClient.setQueryData(
        ['documentGroups', course_name],
        (old: DocumentGroup[] | undefined) => {
          // Perform the optimistic update
          return old?.map((docGroup) => {
            if (docGroup.name === removedGroup) {
              return { ...docGroup, doc_count: (docGroup.doc_count || 0) - 1 }
            }
            return docGroup
          })
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
            if (doc.url === record.url || doc.s3_path === record.s3_path) {
              return {
                ...doc,
                doc_groups: (doc.doc_groups || []).filter(
                  (group) => group !== removedGroup,
                ),
              }
            }
            return doc
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
