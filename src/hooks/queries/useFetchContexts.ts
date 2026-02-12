import { useMutation } from '@tanstack/react-query'
import { fetchContexts } from '../__internal__/fetchContexts'

export interface FetchContextsParams {
  course_name: string
  user_id: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id?: string
}

export function useFetchContexts() {
  return useMutation({
    mutationKey: ['fetchContexts'],
    mutationFn: (params: FetchContextsParams) => fetchContexts(params),
  })
}
