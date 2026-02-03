import { useQuery } from '@tanstack/react-query'

interface NomicMapData {
  map_id: string
  map_link: string
}

async function fetchNomicMap(courseName: string): Promise<NomicMapData> {
  const response = await fetch(
    `/api/getNomicMapForQueries?course_name=${courseName}&map_type=conversation`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch nomic map')
  }
  return response.json()
}

export function useFetchNomicMap(courseName: string) {
  return useQuery({
    queryKey: ['nomicMap', courseName],
    queryFn: () => fetchNomicMap(courseName),
    enabled: Boolean(courseName),
  })
}
