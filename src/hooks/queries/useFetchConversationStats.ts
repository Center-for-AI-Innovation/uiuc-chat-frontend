import { useQuery } from '@tanstack/react-query'

export interface ConversationStatsResponse {
  per_day: { [date: string]: number }
  per_hour: { [hour: string]: number }
  per_weekday: { [day: string]: number }
  heatmap: { [day: string]: { [hour: string]: number } }
  total_count?: number
}

async function fetchConversationStats(
  courseName: string,
  fromDate?: string,
  toDate?: string,
): Promise<ConversationStatsResponse> {
  const response = await fetch('/api/UIUC-api/getConversationStats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_name: courseName,
      from_date: fromDate,
      to_date: toDate,
    }),
  })

  if (!response.ok) {
    console.error('Error fetching conversation stats:', response.status)
    throw new Error(`Error fetching conversation stats: ${response.status}`)
  }

  return response.json()
}

export function useFetchConversationStats({
  courseName,
  fromDate,
  toDate,
  enabled = true,
}: {
  courseName: string
  fromDate?: string
  toDate?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['conversationStats', courseName, fromDate, toDate],
    queryFn: () => fetchConversationStats(courseName, fromDate, toDate),
    enabled: enabled && Boolean(courseName),
  })
}
