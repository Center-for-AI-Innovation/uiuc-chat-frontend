import { useQuery } from '@tanstack/react-query'
import { type WeeklyTrend } from './types'

export type { WeeklyTrend }

async function fetchWeeklyTrends(courseName: string): Promise<WeeklyTrend[]> {
  const response = await fetch('/api/UIUC-api/getWeeklyTrends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_name: courseName,
      project_name: courseName,
    }),
  })

  if (!response.ok) {
    console.error('Error fetching weekly trends:', response.status)
    throw new Error(`Error fetching weekly trends: ${response.status}`)
  }

  return response.json()
}

export function useFetchWeeklyTrends({
  courseName,
  enabled = true,
}: {
  courseName: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['weeklyTrends', courseName],
    queryFn: () => fetchWeeklyTrends(courseName),
    enabled: enabled && Boolean(courseName),
  })
}
