import { useQuery } from '@tanstack/react-query'
import { getBaseUrl } from '~/utils/apiUtils'

interface UserLastAccessResponse {
  last_accessed_at: string | null
}

interface UseFetchUserLastAccessOptions {
  courseName: string
  enabled?: boolean
}

async function fetchUserLastAccess(
  courseName: string,
): Promise<string | null> {
  const endpoint = `${getBaseUrl()}/api/UIUC-api/getUserLastAccess?course_name=${encodeURIComponent(courseName)}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(
      `Error fetching user last access: ${response.statusText || response.status}`,
    )
  }

  const data: UserLastAccessResponse = await response.json()
  return data.last_accessed_at
}

export function useFetchUserLastAccess({
  courseName,
  enabled = true,
}: UseFetchUserLastAccessOptions) {
  return useQuery({
    queryKey: ['userLastAccess', courseName],
    queryFn: () => fetchUserLastAccess(courseName),
    retry: 1,
    enabled: enabled && Boolean(courseName),
  })
}
