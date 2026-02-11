import { useMutation } from '@tanstack/react-query'
import {
  fetchContexts,
  fetchMQRContexts,
} from '../__internal__/fetchContextsForChat'
import {
  type FetchContextsForChatParams,
  type FetchMQRContextsParams,
} from './types'

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
