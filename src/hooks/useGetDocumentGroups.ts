import { useQuery } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { type DocumentGroup } from '~/types/courseMaterials'

export function useGetDocumentGroups(course_name: string) {
  // USAGE:
  // const {
  //   data: documentGroups,
  //   isLoading: isLoadingDocumentGroups,
  //   isError: isErrorDocumentGroups,
  //   refetch: refetchDocumentGroups,
  // } = getDocumentGroups(course_name)
  const auth = useAuth()
  const userId = auth.user?.profile.sub

  return useQuery({
    queryKey: ['documentGroups', course_name],
    queryFn: async () => {
      // try {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDocumentGroups',
          courseName: course_name,
          userId,
        }),
      })
      // console.log('response: ', response)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      const docGroups = data.documents

      return docGroups as DocumentGroup[]
    },
  })
}
