import { useQuery } from '@tanstack/react-query'
import { type NomicMapData } from '~/types/analytics'

async function fetchNomicMapForQueries(
  courseName: string,
): Promise<NomicMapData> {
  const response = await fetch(
    `/api/getNomicMapForQueries?course_name=${courseName}&map_type=conversation`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch nomic map')
  }

  const data = await response.json()
  return {
    map_id: data.map_id,
    map_link: data.map_link,
  }
}

export function useFetchNomicMapForQueries(courseName: string) {
  return useQuery({
    queryKey: ['nomicMapForQueries', courseName],
    queryFn: () => fetchNomicMapForQueries(courseName),
    enabled: !!courseName,
  })
}
