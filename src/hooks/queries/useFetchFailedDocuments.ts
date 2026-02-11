import { useQuery } from '@tanstack/react-query'
import { type FailedDocument, type FailedDocumentsResponse } from './types'

export type { FailedDocument, FailedDocumentsResponse }

async function fetchFailedDocuments({
  courseName,
  from,
  to,
  filterKey,
  filterValue,
  sortColumn,
  sortDirection,
}: {
  courseName: string
  from: number
  to: number
  filterKey: string
  filterValue: string
  sortColumn: string
  sortDirection: string
}): Promise<FailedDocumentsResponse> {
  const response = await fetch(
    `/api/materialsTable/fetchFailedDocuments?from=${from}&to=${to}&course_name=${courseName}&filter_key=${filterKey}&filter_value=${filterValue}&sort_column=${sortColumn}&sort_direction=${sortDirection}`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch failed documents')
  }
  return response.json()
}

export function useFetchFailedDocuments({
  courseName,
  from,
  to,
  filterKey,
  filterValue,
  sortColumn,
  sortDirection,
  refetchInterval,
  staleTime,
  enabled = true,
}: {
  courseName: string
  from: number
  to: number
  filterKey: string
  filterValue: string
  sortColumn: string
  sortDirection: string
  refetchInterval?: number
  staleTime?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      'failedDocuments',
      courseName,
      from,
      to,
      filterKey,
      filterValue,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchFailedDocuments({
        courseName,
        from,
        to,
        filterKey,
        filterValue,
        sortColumn,
        sortDirection,
      }),
    enabled: enabled && Boolean(courseName),
    refetchInterval,
    staleTime,
  })
}
