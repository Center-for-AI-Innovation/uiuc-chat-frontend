import { useQuery } from '@tanstack/react-query'
import type { DocumentSummary } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'

async function fetchDocumentSummary({
  queryKey,
}: {
  queryKey: string[]
}): Promise<DocumentSummary> {
  const [, course_name = ''] = queryKey || []

  const response = await fetch(
    `/api/UIUC-api/getDocumentSummary?course_name=${course_name}`,
  )

  if (!response.ok) {
    throw new Error(`Error fetching document summary: ${response.status}`)
  }

  const data: {
    success: boolean
    error?: string | Error
    documentSummary: DocumentSummary
  } = await response.json()

  if (!data.success) {
    throw new Error(`Error fetching document summary: ${data.error}`)
  }

  return data.documentSummary || {}
}

export function useFetchDocumentSummary(course_name: string) {
  return useQuery({
    queryKey: ['documentSummary', course_name],
    queryFn: fetchDocumentSummary,
    retry: 1,
    enabled: !!course_name,
  })
}
