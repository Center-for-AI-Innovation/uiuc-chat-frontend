import { useQuery } from '@tanstack/react-query'
import { type ProjectStatsResponse } from './types'

async function fetchProjectStats(
  courseName: string,
): Promise<ProjectStatsResponse> {
  const response = await fetch('/api/UIUC-api/getProjectStats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_name: courseName, project_name: courseName }),
  })

  if (!response.ok) {
    console.error('Error fetching project stats:', response.status)
    throw new Error(`Error fetching project stats: ${response.status}`)
  }

  return response.json()
}

export function useFetchProjectStats({
  courseName,
  enabled = true,
}: {
  courseName: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['projectStats', courseName],
    queryFn: () => fetchProjectStats(courseName),
    enabled: enabled && Boolean(courseName),
  })
}
