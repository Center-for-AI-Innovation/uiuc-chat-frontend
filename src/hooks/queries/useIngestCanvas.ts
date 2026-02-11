import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type IngestCanvasRequest, type IngestCanvasResponse } from './types'

async function ingestCanvas(
  body: IngestCanvasRequest,
): Promise<IngestCanvasResponse> {
  const response = await fetch('/api/UIUC-api/ingestCanvas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

export function useIngestCanvas(courseName: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['ingestCanvas'],
    mutationFn: ingestCanvas,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', courseName],
      })
    },
  })
}
