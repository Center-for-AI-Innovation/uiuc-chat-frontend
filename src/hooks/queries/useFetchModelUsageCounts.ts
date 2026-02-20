// Query: Fetches LLM model usage counts for a project's analytics dashboard.
import { useQuery } from '@tanstack/react-query'
import { type ModelUsage } from '~/types/analytics'

async function fetchModelUsageCounts(
  courseName: string,
): Promise<ModelUsage[]> {
  const response = await fetch('/api/UIUC-api/getModelUsageCounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_name: courseName, project_name: courseName }),
  })

  if (!response.ok) {
    console.error('Error fetching model usage counts:', response.status)
    throw new Error(`Error fetching model usage counts: ${response.status}`)
  }

  return response.json()
}

export function useFetchModelUsageCounts({
  courseName,
  enabled = true,
}: {
  courseName: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['modelUsageCounts', courseName],
    queryFn: () => fetchModelUsageCounts(courseName),
    enabled: enabled && Boolean(courseName),
  })
}
