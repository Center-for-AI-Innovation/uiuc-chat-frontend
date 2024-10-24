import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { showConfirmationToast } from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

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
  return useMutation({
    mutationFn: async ({
      projectName,
      llmProviders,
      defaultModelID,
      defaultTemperature,
    }: {
      projectName: string
      queryClient: QueryClient
      llmProviders: AllLLMProviders
      defaultModelID?: string
      defaultTemperature?: string
    }) => {
      const response = await fetch('/api/UIUC-api/upsertLLMProviders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          llmProviders: llmProviders,
          defaultModelID: defaultModelID,
          defaultTemperature: defaultTemperature,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to set LLM providers')
      }
      return response.json()
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

      // Optimistically update to the new value
      queryClient.setQueryData(['projectLLMProviders', variables.projectName], {
        ...variables.llmProviders,
        defaultModel: variables.defaultModelID,
        defaultTemp: parseFloat(variables.defaultTemperature ?? '0.1'),
      })

      // Return a context object with the snapshotted value
      return { previousLLMProviders }
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ['projectLLMProviders', newData.projectName],
        context?.previousLLMProviders,
      )
      showConfirmationToast({
        title: 'Failed to set LLM providers',
        message: `The database request failed with error: ${err.name} -- ${err.message}`,
        isError: true,
      })
    },
    onSuccess: (data, variables, context) => {
      // Optionally, you can show a success toast here
      // showConfirmationToast({
      //   title: 'Updated LLM providers',
      //   message: `Now your project's users can use the supplied LLMs!`,
      //   isError: false,
      // })
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['projectLLMProviders', variables.projectName],
      })
    },
  })
}
