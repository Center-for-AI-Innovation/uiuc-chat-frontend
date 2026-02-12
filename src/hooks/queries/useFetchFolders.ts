// Query: Fetches conversation folders for a user. Auto-refetches every 20s.
import { useQuery } from '@tanstack/react-query'
import { fetchFolders } from '@/hooks/__internal__/folders'

export function useFetchFolders(user_email: string, course_name: string) {
  return useQuery({
    queryKey: ['folders', course_name],
    queryFn: async () =>
      user_email ? fetchFolders(course_name, user_email) : [],
    enabled: !!user_email,
    refetchInterval: 20_000,
  })
}
