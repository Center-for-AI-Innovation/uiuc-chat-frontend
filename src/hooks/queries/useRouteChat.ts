import { useMutation } from '@tanstack/react-query'

import { type ChatBody } from '~/types/chat'

async function routeChat(body: ChatBody): Promise<Response> {
  const response = await fetch('/api/allNewRoutingChat', {
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
        'The LLM might be overloaded or misconfigured. Please check your API key, or use a different LLM.',
    )
    ;(error as Error & { title?: string }).title =
      errorData.title || "LLM Didn't Respond"
    throw error
  }

  return response
}

export function useRouteChat() {
  return useMutation({
    mutationKey: ['routeChat'],
    mutationFn: routeChat,
  })
}
