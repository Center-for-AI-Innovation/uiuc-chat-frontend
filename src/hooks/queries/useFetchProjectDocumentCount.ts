// Query: Fetches the total document count for a project/course.
import { useQuery } from '@tanstack/react-query'

async function fetchProjectDocumentCount(courseName: string): Promise<number> {
  const response = await fetch(
    `/api/materialsTable/fetchProjectMaterials?from=0&to=0&course_name=${courseName}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch document count')
  }

  const data = await response.json()
  return data.total_count || 0
}

export function useFetchProjectDocumentCount(courseName: string) {
  return useQuery({
    queryKey: ['projectDocumentCount', courseName],
    queryFn: () => fetchProjectDocumentCount(courseName),
    enabled: !!courseName,
  })
}
