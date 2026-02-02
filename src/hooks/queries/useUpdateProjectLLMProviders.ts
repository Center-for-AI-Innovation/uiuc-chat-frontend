import { type QueryClient } from '@tanstack/react-query'
import { useSetProjectLLMProviders } from '~/hooks/useProjectAPIKeys'

export function useUpdateProjectLLMProviders(queryClient: QueryClient) {
  return useSetProjectLLMProviders(queryClient)
}

