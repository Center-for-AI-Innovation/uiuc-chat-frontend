// Mutation: Submits a file for ingestion into the project's knowledge base. Also exports the raw function.
import { useMutation } from '@tanstack/react-query'

export type IngestRequest = {
  uniqueFileName: string
  courseName: string
  readableFilename: string
}

export type IngestResponse = {
  task_id?: string
  error?: string
}

async function ingest(body: IngestRequest): Promise<IngestResponse> {
  const response = await fetch('/api/UIUC-api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data: IngestResponse = await response.json()

  if (!response.ok) {
    console.error('Error submitting ingest:', response.status)
    throw new Error(data.error || `HTTP error! status: ${response.status}`)
  }

  return data
}

export function useIngest() {
  return useMutation({
    mutationKey: ['ingest'],
    mutationFn: ingest,
  })
}
