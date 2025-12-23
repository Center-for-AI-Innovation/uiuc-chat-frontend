import { useQuery } from '@tanstack/react-query'
import { fetchFolders } from '~/hooks/__internal__/folders'

export function useFetchFolders(user_email: string, course_name: string) {
  return useQuery({
    queryKey: ['folders', course_name],
    queryFn: async () => (user_email ? fetchFolders(course_name) : []),
    enabled: !!user_email,
    refetchInterval: 20_000,
  })
}
