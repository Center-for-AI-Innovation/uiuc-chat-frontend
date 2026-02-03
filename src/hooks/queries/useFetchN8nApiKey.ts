import { useQuery } from '@tanstack/react-query'

async function fetchN8nApiKey(courseName: string): Promise<string | undefined> {
  const response = await fetch('/api/UIUC-api/getN8Napikey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ course_name: courseName }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch N8N API key')
  }

  const data = await response.json()
  return data.api_key?.[0]?.n8n_api_key
}

export function useFetchN8nApiKey(courseName: string) {
  return useQuery({
    queryKey: ['n8nApiKey', courseName],
    queryFn: () => fetchN8nApiKey(courseName),
    enabled: Boolean(courseName),
  })
}
