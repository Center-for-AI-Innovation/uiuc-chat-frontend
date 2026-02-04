import { type QueryClient, useMutation } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useMemo } from 'react'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

<<<<<<< HEAD:src/hooks/useProjectAPIKeys.ts
export function useGetProjectLLMProviders({
  projectName,
}: {
  projectName: string
}) {
  // USAGE:
  // const {
  //   data: projectLLMProviders,
  //   isLoading: isLoadingprojectLLMProviders,
  //   isError: isErrorprojectLLMProviders,
  //   refetch: refetchprojectLLMProviders,
  // } = useGetProjectLLMProviders(course_name)

  return useQuery({
    queryKey: ['projectLLMProviders', projectName],
    queryFn: async () => {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch LLM providers')
      }

      const data = await response.json()
      return data as AllLLMProviders
    },
    retry: 1, // Limit retries to 1
  })
}

export function useSetProjectLLMProviders(queryClient: QueryClient) {
  const pendingRef = useRef<
    {
      resolve: (value: unknown) => void
      reject: (reason?: unknown) => void
    }[]
  >([])

=======
export function useUpdateProjectLLMProviders(queryClient: QueryClient) {
>>>>>>> 3b85146fb3e0771f56cd6d0a4034601fe98ab7b0:src/hooks/queries/useUpdateProjectLLMProviders.ts
  const debouncedApiCall = useMemo(
    () =>
      debounce(
        async (variables: { projectName: string; llmProviders: AllLLMProviders }) => {
          // Capture and clear pending promises at call time so an in-flight request
          // can't resolve/reject promises added by later mutations.
          const pending = pendingRef.current
          pendingRef.current = []

          try {
            const response = await fetch('/api/UIUC-api/upsertLLMProviders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(variables),
            })
            if (!response.ok) {
              throw new Error('Failed to set LLM settings.')
            }
            const data = await response.json()
            pending.forEach(({ resolve }) => resolve(data))
          } catch (err) {
            pending.forEach(({ reject }) => reject(err))
          }
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
        pendingRef.current.push({ resolve, reject })
        debouncedApiCall(variables)
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
