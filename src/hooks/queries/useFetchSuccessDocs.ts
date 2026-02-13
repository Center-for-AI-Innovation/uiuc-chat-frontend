import { useQuery } from '@tanstack/react-query'

interface SuccessDoc {
  readable_filename: string
  base_url: string
  url: string
}

async function fetchSuccessDocs(courseName: string): Promise<SuccessDoc[]> {
  const response = await fetch(
    `/api/materialsTable/successDocs?course_name=${courseName}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch success docs')
  }

  const data = await response.json()
  return data.documents ?? []
}

export function useFetchSuccessDocs(courseName: string) {
  return useQuery({
    queryKey: ['successDocs', courseName],
    queryFn: () => fetchSuccessDocs(courseName),
    enabled: !!courseName,
  })
}
