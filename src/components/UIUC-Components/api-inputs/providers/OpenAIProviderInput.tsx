import React from 'react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type OpenAIProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function OpenAIProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: OpenAIProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="OpenAI"
      providerKey={ProviderNames.OpenAI}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://platform.openai.com/account/api-keys"
    >
      <form.Field name={`providers.${ProviderNames.OpenAI}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="OpenAI API Key" />
        )}
      </form.Field>
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
