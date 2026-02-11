import { useQuery } from '@tanstack/react-query'
import { type ProjectMaterialsResponse } from './types'

async function fetchProjectMaterials({
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
}): Promise<ProjectMaterialsResponse> {
  const response = await fetch(
    `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${courseName}&filter_key=${filterKey}&filter_value=${filterValue}&sort_column=${sortColumn}&sort_direction=${sortDirection}`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch project materials')
  }
  return response.json()
}

export function useFetchProjectMaterials({
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
      'documents',
      courseName,
      from,
      to,
      filterKey,
      filterValue,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchProjectMaterials({
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
