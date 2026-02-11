import { useQuery } from '@tanstack/react-query'
import {
  type UseFetchAllCourseNamesOptions,
  type AllCourseNamesResponse,
} from './types'

async function fetchAllCourseNames(): Promise<string[]> {
  const response = await fetch('/api/UIUC-api/getAllCourseNames')

  if (!response.ok) {
    throw new Error(`Error fetching all course names: ${response.status}`)
  }

  const data: AllCourseNamesResponse = await response.json()
  return data.all_course_names
}

export function useFetchAllCourseNames({
  enabled = true,
}: UseFetchAllCourseNamesOptions = {}) {
  return useQuery({
    queryKey: ['allCourseNames'],
    queryFn: fetchAllCourseNames,
    retry: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since course names don't change often
  })
}
