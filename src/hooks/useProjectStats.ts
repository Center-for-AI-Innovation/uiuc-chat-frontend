import { useEffect, useState } from 'react'

export interface CourseStats {
  total_conversations: number
  total_users: number
  total_messages: number
  avg_conversations_per_user: number
  avg_messages_per_user: number
  avg_messages_per_conversation: number
}

const ZERO_STATS: CourseStats = {
  total_conversations: 0,
  total_users: 0,
  total_messages: 0,
  avg_conversations_per_user: 0,
  avg_messages_per_user: 0,
  avg_messages_per_conversation: 0,
}

export function useProjectStats(courseName: string) {
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseName) return

    const fetchCourseStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/UIUC-api/getProjectStats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_name: courseName,
            project_name: courseName,
          }),
        })
        if (response.status === 200) {
          const data = await response.json()
          // Averages are derived server-side; read all fields directly.
          setCourseStats({
            total_conversations: data.total_conversations ?? 0,
            total_messages: data.total_messages ?? 0,
            total_users: data.unique_users ?? 0,
            avg_conversations_per_user: data.avg_conversations_per_user ?? 0,
            avg_messages_per_user: data.avg_messages_per_user ?? 0,
            avg_messages_per_conversation:
              data.avg_messages_per_conversation ?? 0,
          })
        } else {
          throw new Error('Failed to fetch project stats')
        }
      } catch (err) {
        // A new or empty project legitimately has no activity; surface real
        // zeros instead of leaving every card blank ("—") indefinitely.
        setError('Failed to load stats')
        setCourseStats(ZERO_STATS)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseStats()
  }, [courseName])

  return { courseStats, isLoading, error }
}
