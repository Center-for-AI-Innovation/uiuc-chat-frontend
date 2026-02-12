import { useMutation } from '@tanstack/react-query'
import {
  fetchContexts,
  fetchMQRContexts,
} from '../__internal__/fetchContextsForChat'

export interface FetchContextsForChatParams {
  course_name: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id?: string
}

export interface FetchMQRContextsParams {
  course_name: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id: string
}

export { fetchContexts, fetchMQRContexts }

export function useFetchContextsForChatMutation() {
  return useMutation({
    mutationKey: ['fetchContextsForChat'],
    mutationFn: ({
      course_name,
      search_query,
      token_limit,
      doc_groups,
      conversation_id,
    }: FetchContextsForChatParams) =>
      fetchContexts(
        course_name,
        search_query,
        token_limit,
        doc_groups,
        conversation_id,
      ),
  })
}

export function useFetchMQRContextsMutation() {
  return useMutation({
    mutationKey: ['fetchMQRContexts'],
    mutationFn: ({
      course_name,
      search_query,
      token_limit,
      doc_groups,
      conversation_id,
    }: FetchMQRContextsParams) =>
      fetchMQRContexts(
        course_name,
        search_query,
        token_limit,
        doc_groups,
        conversation_id,
      ),
  })
}
