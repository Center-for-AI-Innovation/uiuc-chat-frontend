import { useMutation } from '@tanstack/react-query'
import { fetchContexts } from '../__internal__/fetchContexts'
import { type FetchContextsParams } from './types'

export function useFetchContexts() {
  return useMutation({
    mutationKey: ['fetchContexts'],
    mutationFn: (params: FetchContextsParams) => fetchContexts(params),
  })
}
