// Query: Fetches documents currently being ingested/processed for a course.
import { useQuery } from '@tanstack/react-query'
import { type DocInProgress } from '~/types/courseMaterials'

export type { DocInProgress }

export interface DocsInProgressResponse {
  documents: DocInProgress[]
}

async function fetchDocsInProgress(
  courseName: string,
): Promise<DocsInProgressResponse> {
  const response = await fetch(
    `/api/materialsTable/docsInProgress?course_name=${courseName}`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch docs in progress')
  }
  return response.json()
}

export function useFetchDocsInProgress(courseName: string) {
  return useQuery({
    queryKey: ['docsInProgress', courseName],
    queryFn: () => fetchDocsInProgress(courseName),
    enabled: Boolean(courseName),
  })
}
