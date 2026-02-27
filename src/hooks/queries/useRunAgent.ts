import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import {
  runAgentStream,
  type UseAgentStreamCallbacks,
} from '~/hooks/useAgentStream'
import type { AgentRunRequest } from '~/types/agentStream'

type RunAgentVariables = {
  request: AgentRunRequest
  callbacks: UseAgentStreamCallbacks
}

export function useRunAgent() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  const mutation = useMutation({
    mutationKey: ['runAgent'],
    mutationFn: async ({ request, callbacks }: RunAgentVariables) => {
      abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      await runAgentStream(request, callbacks, controller.signal)
    },
    onSettled: () => {
      abortControllerRef.current = null
    },
  })

  return {
    ...mutation,
    abort,
  }
}
