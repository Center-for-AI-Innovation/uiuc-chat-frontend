import React from 'react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type GeminiProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function GeminiProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: GeminiProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="Google Gemini"
      providerKey={ProviderNames.Gemini}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://ai.google.dev/"
    >
      <form.Field name={`providers.${ProviderNames.Gemini}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="Google API Key" />
        )}
      </form.Field>
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
