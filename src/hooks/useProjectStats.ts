import { useEffect, useState } from 'react'

export interface CourseStats {
  total_conversations: number
  total_users: number
  total_messages: number
  avg_conversations_per_user: number
  avg_messages_per_user: number
  avg_messages_per_conversation: number
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
          setCourseStats({
            total_conversations: data.total_conversations,
            total_messages: data.total_messages,
            total_users: data.unique_users,
            avg_conversations_per_user: data.avg_conversations_per_user,
            avg_messages_per_user: data.avg_messages_per_user,
            avg_messages_per_conversation: data.avg_messages_per_conversation,
          })
        } else {
          throw new Error('Failed to fetch project stats')
        }
      } catch (err) {
        setError('Failed to load stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseStats()
  }, [courseName])

  return { courseStats, isLoading, error }
}
