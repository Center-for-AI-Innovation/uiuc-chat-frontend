import { useQuery } from '@tanstack/react-query'

interface ProjectStatsResponse {
  total_conversations: number
  total_messages: number
  unique_users: number
  avg_conversations_per_user: number
  avg_messages_per_user: number
  avg_messages_per_conversation: number
}

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
