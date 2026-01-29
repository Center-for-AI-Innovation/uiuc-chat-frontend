import { type QueryClient, useMutation } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useMemo } from 'react'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

export function useUpdateProjectLLMProviders(queryClient: QueryClient) {
  const debouncedApiCall = useMemo(
    () =>
      debounce(
        (
          variables: {
            projectName: string
            llmProviders: AllLLMProviders
          },
          resolve: (value: any) => void,
          reject: (reason?: any) => void,
        ) => {
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
              return response.json()
            })
            .then(resolve)
            .catch(reject)
        },
        1000,
        { maxWait: 10000 },
      ),
    [],
  )

  return useMutation({
    mutationFn: async (variables: {
      projectName: string
      llmProviders: AllLLMProviders
    }) => {
      return new Promise((resolve, reject) => {
        debouncedApiCall(variables, resolve, reject)
      })
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['projectLLMProviders', variables.projectName],
      })

      // Snapshot the previous value
      const previousLLMProviders = queryClient.getQueryData([
        'projectLLMProviders',
        variables.projectName,
      ])

      // Return a context object with the snapshotted value
      return { previousLLMProviders }
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ['projectLLMProviders', newData.projectName],
        context?.previousLLMProviders,
      )
    },
    onSuccess: (data, variables) => {
      // showConfirmationToast({
      //   title: 'Updated LLM providers',
      //   message: `Successfully updated your project's LLM settings!`,
      // })
    },
    onSettled: (data, error, variables) => {
      // showConfirmationToast({
      //   title: 'onSettled',
      //   message: `Settled.`,
      // })
      // Always invalidate the query after mutation settles(success or error)
      queryClient.invalidateQueries({
        queryKey: ['projectLLMProviders', variables.projectName],
      })
    },
  })
}
