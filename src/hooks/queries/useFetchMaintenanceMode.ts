import { useQuery } from '@tanstack/react-query'
import {
  type UseFetchMaintenanceModeOptions,
  type MaintenanceModeResponse,
} from './types'

async function fetchMaintenanceMode(): Promise<boolean> {
  const response = await fetch('/api/UIUC-api/getMaintenanceModeFast')

  if (!response.ok) {
    throw new Error(`Error fetching maintenance mode: ${response.status}`)
  }

  const data: MaintenanceModeResponse = await response.json()
  return data.isMaintenanceMode
}

export function useFetchMaintenanceMode({
  enabled = true,
}: UseFetchMaintenanceModeOptions = {}) {
  return useQuery({
    queryKey: ['maintenanceMode'],
    queryFn: fetchMaintenanceMode,
    retry: 1,
    enabled,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid flickering
  })
}
