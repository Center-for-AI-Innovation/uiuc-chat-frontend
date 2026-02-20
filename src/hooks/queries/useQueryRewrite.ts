// Mutation: Rewrites a user query for improved search/retrieval before sending to the LLM.
import { useMutation } from '@tanstack/react-query'

import { type ChatBody } from '~/types/chat'

async function runQueryRewrite(body: ChatBody): Promise<Response> {
  const response = await fetch('/api/queryRewrite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(
      errorData.message ||
        errorData.error ||
        'Failed to run query rewrite. Please try again.',
    )
    ;(error as Error & { title?: string }).title =
      errorData.title || 'Query Rewrite Error'
    throw error
  }

  return response
}

export function useQueryRewrite() {
  return useMutation({
    mutationKey: ['queryRewrite'],
    mutationFn: runQueryRewrite,
  })
}
