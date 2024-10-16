import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { showConfirmationToast } from '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import {
  AllLLMProviders,
  AnySupportedModel,
  ProjectWideLLMProviders,
} from '~/utils/modelProviders/LLMProvider'

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
      return data as ProjectWideLLMProviders
    },
    retry: 1, // Limit retries to 1
  })
}

export function useSetProjectLLMProviders(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async ({
      projectName,
      llmProviders,
    }: {
      projectName: string
      queryClient: QueryClient
      llmProviders: ProjectWideLLMProviders
    }) => {
      const response = await fetch('/api/UIUC-api/upsertLLMProviders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          llmProviders: llmProviders,
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
      })

      // if (variables.llmProviders.defaultModel) {
      //   // Find the provider that matches the default model
      //   let defaultProvider: variables.llmProviders.defaultModel.name
      //   switch (defaultProvider) {
      //     case 'OpenAI':
      //       if (!variables.llmProviders.providers.OpenAI.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     case 'Anthropic':
      //       if (!variables.llmProviders.providers.Anthropic.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     case 'Azure':
      //       if (!variables.llmProviders.providers.Azure.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     case 'Ollama':
      //       if (!variables.llmProviders.providers.Ollama.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     case 'WebLLM':
      //       if (!variables.llmProviders.providers.WebLLM.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     case 'NCSAHosted':
      //       if (!variables.llmProviders.providers.NCSAHosted.isEnabled) {
      //         variables.llmProviders.defaultModel = undefined
      //       }
      //       break;
      //     default:
      //       console.warn(`Unknown provider for default model: ${variables.llmProviders.defaultModel.provider}`);
      //   }
      // }

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
