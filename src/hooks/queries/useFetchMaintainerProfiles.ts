import { useQuery } from '@tanstack/react-query'
import type { MaintainerProfile } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

async function fetchMaintainerProfiles({
  queryKey,
}: {
  queryKey: string[]
}): Promise<MaintainerProfile[]> {
  const [, course_name = ''] = queryKey || []

  const response = await fetch(
    `/api/UIUC-api/getMaintainerProfiles?course_name=${course_name}`,
  )

  if (!response.ok) {
    throw new Error(`Error fetching maintainer profiles: ${response.status}`)
  }

  const data: {
    success: boolean
    error?: string | Error
    profiles: MaintainerProfile[]
  } = await response.json()

  if (!data.success) {
    throw new Error(`Error fetching maintainer profiles: ${data.error}`)
  }

  return data.profiles || []
}

export function useFetchMaintainerProfiles(course_name: string) {
  return useQuery({
    queryKey: ['maintainerProfiles', course_name],
    queryFn: fetchMaintainerProfiles,
    retry: 1,
    enabled: !!course_name,
  })
}
