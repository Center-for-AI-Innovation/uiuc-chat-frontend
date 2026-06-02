import React from 'react'
import { ModelToggles } from '../ModelToggles'
import {
  ProviderNames,
  type WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function WebLLMProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: WebLLMProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="WebLLM"
      providerKey={ProviderNames.WebLLM}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://github.com/mlc-ai/web-llm"
      description="WebLLM is a framework for building and deploying LLMs in the browser."
    >
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
