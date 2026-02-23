// Mutation: Updates a project's LLM provider configuration with debouncing (1s debounce, 10s max wait) and optimistic cache updates.
import { type QueryClient, useMutation } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useMemo, useRef } from 'react'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'
import { queryKeys } from './keys'

type UpdateProjectLLMProvidersVariables = {
  projectName: string
  llmProviders: AllLLMProviders
}

type UpdateProjectLLMProvidersResponse = {
  success: boolean
  error?: string
}

type UpdateProjectLLMProvidersContext = {
  previousLLMProviders?: AllLLMProviders
}

export type PendingPromise = {
  resolve: (value: UpdateProjectLLMProvidersResponse) => void
  reject: (reason?: Error) => void
}

export function useUpdateProjectLLMProviders(queryClient: QueryClient) {
  const pendingRef = useRef<PendingPromise[]>([])

  const debouncedApiCall = useMemo(
    () =>
      debounce(
        (variables: UpdateProjectLLMProvidersVariables) => {
          const batch = pendingRef.current.splice(0)

          fetch('/api/UIUC-api/upsertLLMProviders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(variables),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Failed to set LLM settings.')
              }
              return response.json() as Promise<UpdateProjectLLMProvidersResponse>
            })
            .then((data) => {
              for (const p of batch) p.resolve(data)
            })
            .catch((error) => {
              const normalizedError =
                error instanceof Error
                  ? error
                  : new Error('Failed to set LLM settings.')
              for (const p of batch) p.reject(normalizedError)
            })
        },
        1000,
        { maxWait: 10000 },
      ),
    [],
  )

  return useMutation({
    mutationFn: async (variables: UpdateProjectLLMProvidersVariables) => {
      return new Promise<UpdateProjectLLMProvidersResponse>(
        (resolve, reject) => {
          pendingRef.current.push({ resolve, reject })
          debouncedApiCall(variables)
        },
      )
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.projectLLMProviders(variables.projectName),
      })

      // Snapshot the previous value
      const previousLLMProviders = queryClient.getQueryData<AllLLMProviders>(
        queryKeys.projectLLMProviders(variables.projectName),
      )

      // Return a context object with the snapshotted value
      return { previousLLMProviders }
    },
    onError: (_err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        queryKeys.projectLLMProviders(newData.projectName),
        context?.previousLLMProviders,
      )
    },
    onSuccess: (_data, _variables) => {
      // showConfirmationToast({
      //   title: 'Updated LLM providers',
      //   message: `Successfully updated your project's LLM settings!`,
      // })
    },
    onSettled: (_data, _error, variables) => {
      // showConfirmationToast({
      //   title: 'onSettled',
      //   message: `Settled.`,
      // })
      // Always invalidate the query after mutation settles(success or error)
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectLLMProviders(variables.projectName),
      })
    },
  })
}
