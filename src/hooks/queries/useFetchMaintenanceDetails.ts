import { useQuery } from '@tanstack/react-query'

export interface UseFetchMaintenanceDetailsOptions {
  enabled?: boolean
}

export interface MaintenanceDetailsResponse {
  isMaintenanceMode: boolean
  maintenanceBodyText: string
  maintenanceTitleText: string
}

async function fetchMaintenanceDetails(): Promise<MaintenanceDetailsResponse> {
  const response = await fetch('/api/UIUC-api/getMaintenanceModeDetails')

  if (!response.ok) {
    throw new Error(`Error fetching maintenance details: ${response.status}`)
  }

  const data: MaintenanceDetailsResponse = await response.json()
  return data
}

export function useFetchMaintenanceDetails({
  enabled = true,
}: UseFetchMaintenanceDetailsOptions = {}) {
  return useQuery({
    queryKey: ['maintenanceDetails'],
    queryFn: fetchMaintenanceDetails,
    retry: 1,
    enabled,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}
