import { useQuery } from '@tanstack/react-query'

export interface DocInProgress {
  readable_filename: string
  base_url: string
  url: string
}

interface DocsInProgressResponse {
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
