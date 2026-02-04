import { type QueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import {
  type CourseDocument,
  type DocumentGroup,
} from '~/types/courseMaterials'

export function useAppendToDocGroup(
  course_name: string,
  queryClient: QueryClient,
  page: number,
) {
  // USAGE:
  // removeFromDocGroup (course_name) -mutate(f
  //
  // record, removedGroup,
  // })
  const auth = useAuth()
  const userId = auth.user?.profile.sub

  return useMutation({
    mutationFn: async ({
      record,
      appendedGroup,
    }: {
      record: CourseDocument
      appendedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'appendDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: appendedGroup,
          userId,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to append document group')
      }
      return response.json()
    },
    // Optimistically update the cache
    onMutate: async ({ record, appendedGroup }) => {
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
          console.log('old doc groups: ', old)
          // Perform the optimistic update
          const updatedDocumentGroups = old?.map((docGroup) => {
            if (docGroup.name === appendedGroup) {
              return { ...docGroup, doc_count: (docGroup.doc_count || 0) + 1 }
            }
            return docGroup
          })
          return updatedDocumentGroups
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
          // Perform the optimistic update
          if (!old) return

          const updatedDocuments = old?.final_docs.map((doc) => {
            if (doc.url === record.url || doc.s3_path === record.s3_path) {
              return {
                ...doc,
                doc_groups: [...(doc.doc_groups || []), appendedGroup],
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
