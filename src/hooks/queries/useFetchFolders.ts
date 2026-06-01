import { useQuery } from '@tanstack/react-query'
import { fetchFolders } from '@/hooks/__internal__/folders'

export function useFetchFolders(
  user_email: string,
  searchTerm: string,
  course_name: string,
) {
  const normalizedSearchTerm = searchTerm || ''

  return useQuery({
    queryKey: ['folders', course_name, normalizedSearchTerm],
    queryFn: async () =>
      user_email
        ? fetchFolders(course_name, normalizedSearchTerm, user_email)
        : [],
    enabled:
      !!user_email && typeof course_name === 'string' && course_name.length > 0,
    refetchInterval: 20_000,
  })
}
