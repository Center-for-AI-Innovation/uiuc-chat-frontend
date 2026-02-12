import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchPresignedUrl } from '@/hooks/__internal__/downloadPresignedUrl'

export type DownloadPresignedUrlRequest = {
  filePath: string
  courseName?: string
  page?: string
  fileName?: string
}

// --- Mutation hook (for imperative use in event handlers) ---

export function useDownloadPresignedUrl() {
  return useMutation({
    mutationFn: ({
      filePath,
      courseName,
      page,
      fileName,
    }: DownloadPresignedUrlRequest) =>
      fetchPresignedUrl(filePath, courseName, page, fileName),
  })
}

// --- Query hook (for declarative use on mount/param change) ---

export function useDownloadPresignedUrlQuery(
  filePath: string | undefined,
  courseName?: string,
) {
  return useQuery({
    queryKey: ['presignedUrl', 'download', filePath, courseName],
    enabled: Boolean(filePath),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchPresignedUrl(filePath!, courseName),
  })
}
