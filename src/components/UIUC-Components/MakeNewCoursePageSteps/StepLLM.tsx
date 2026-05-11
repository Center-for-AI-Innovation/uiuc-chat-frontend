import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchLLMProviders } from '@/hooks/queries/useFetchLLMProviders'
import { useUpdateProjectLLMProviders } from '@/hooks/queries/useUpdateProjectLLMProviders'
import {
  ProviderNames,
  type AllLLMProviders,
} from '~/utils/modelProviders/LLMProvider'
import { NCSAHostedVLMModelID } from '~/utils/modelProviders/types/NCSAHostedVLM'
import HeaderStepNavigation from './HeaderStepNavigation'
import APIKeyInputForm from '../api-inputs/LLMsApiKeyInputForm'

/**
 * For new projects, disable all providers except NCSAHosted/NCSAHostedVLM
 * and set Qwen 2.5 VL 72B as the default model.
 */
function applyNCSAOnlyDefaults(providers: AllLLMProviders): AllLLMProviders {
  const modified = { ...providers }

  for (const key of Object.keys(modified)) {
    const providerName = key as ProviderNames
    const provider = modified[providerName]
    if (!provider) continue

    if (
      providerName === ProviderNames.NCSAHosted ||
      providerName === ProviderNames.NCSAHostedVLM
    ) {
      continue
    }

    // Disable all other providers
    ;(modified as any)[providerName] = { ...provider, enabled: false }
  }

  // Clear all default flags, then set Qwen 2.5 VL 72B as the default model
  for (const key of Object.keys(modified)) {
    const provider = modified[key as ProviderNames]
    if (provider?.models) {
      ;(provider as any).models = provider.models.map((m: any) => ({
        ...m,
        default:
          key === ProviderNames.NCSAHostedVLM &&
          m.id === NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
      }))
    }
  }

  return modified
}

const StepLLM = ({ project_name }: { project_name: string }) => {
  const queryClient = useQueryClient()
  const { data: llmProviders } = useFetchLLMProviders({
    projectName: project_name,
  })
  const mutation = useUpdateProjectLLMProviders(queryClient)
  const hasAppliedDefaults = useRef(false)

  useEffect(() => {
    if (!llmProviders || hasAppliedDefaults.current) return

    // Skip if defaults were already configured (user already visited this step)
    const hasDefaultModel = Object.values(llmProviders).some((provider) =>
      provider?.models?.some((m: any) => m.default),
    )
    if (hasDefaultModel) return

    hasAppliedDefaults.current = true
    const modified = applyNCSAOnlyDefaults(llmProviders)

    // Update cache immediately so APIKeyInputForm renders with correct state
    queryClient.setQueryData(['projectLLMProviders', project_name], modified)

    // Persist to backend
    mutation.mutate({
      projectName: project_name,
      llmProviders: modified,
    })
  }, [llmProviders])

  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Configure AI Models"
          description="Set up API keys for the LLM providers you want to use."
        />

        <div className="step_content">
          <APIKeyInputForm projectName={project_name} isEmbedded={true} />
        </div>
      </div>
    </>
  )
}

export default StepLLM
