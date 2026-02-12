// Query: Fetches whether the app is in maintenance mode (boolean). Cached for 30s, no refetch on focus.
import { useQuery } from '@tanstack/react-query'

export interface UseFetchMaintenanceModeOptions {
  enabled?: boolean
}

export interface MaintenanceModeResponse {
  isMaintenanceMode: boolean
}

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
