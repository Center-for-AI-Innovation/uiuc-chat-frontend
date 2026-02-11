import { useQuery } from '@tanstack/react-query'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'
import {
  type FetchLLMProvidersVariables,
  type UseFetchLLMProvidersOptions,
} from './types'

async function fetchLLMProviders({
  projectName,
}: FetchLLMProvidersVariables): Promise<AllLLMProviders> {
  const response = await fetch('/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectName,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch LLM providers')
  }

  const data = (await response.json()) as AllLLMProviders | undefined
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No LLM providers returned from API')
  }

  return data
}

export function useFetchLLMProviders({
  projectName,
  enabled = true,
}: UseFetchLLMProvidersOptions) {
  return useQuery({
    queryKey: ['projectLLMProviders', projectName],
    queryFn: () => fetchLLMProviders({ projectName }),
    retry: 1,
    enabled: enabled && Boolean(projectName),
  })
}
