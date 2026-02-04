import { useQuery } from '@tanstack/react-query'

async function fetchPresignedUrl(
  s3Path: string,
  courseName: string,
): Promise<string> {
  const params = new URLSearchParams({
    s3_path: s3Path,
    course_name: courseName,
  })
  const res = await fetch(`/api/UIUC-api/getPresignedUrl?${params}`)
  if (!res.ok) throw new Error('Failed to fetch banner URL')
  const json = await res.json()
  return json.presignedUrl as string
}

export function useFetchPresignedUrl(
  courseName: string | undefined,
  s3Path: string | undefined,
) {
  return useQuery({
    queryKey: ['presignedUrl', courseName, s3Path],
    enabled: Boolean(courseName && courseName !== 'chat') && Boolean(s3Path),
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchPresignedUrl(s3Path as string, courseName as string),
  })
}
