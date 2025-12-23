import { useQuery } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'
import { type DocumentGroup } from '~/types/courseMaterials'

async function fetchEnabledDocGroups(
  course_name: string,
  userId?: string,
): Promise<DocumentGroup[]> {
  const response = await fetch('/api/documentGroups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'fetchEnabledDocGroups',
      courseName: course_name,
      userId,
    }),
  })
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  const docGroups = data.documents

  return docGroups as DocumentGroup[]
}

export function useFetchEnabledDocGroups(course_name: string) {
  // USAGE:
  // const {
  //   data: documentGroups,
  //   isLoading: isLoadingDocumentGroups,
  //   isError: isErrorDocumentGroups,
  //   refetch: refetchDocumentGroups,
  // } = useFetchEnabledDocGroups(course_name)
  const auth = useAuth()
  const userId = auth.user?.profile.sub

  return useQuery({
    queryKey: ['documentGroups', course_name],
    queryFn: () => fetchEnabledDocGroups(course_name, userId),
  })
}
