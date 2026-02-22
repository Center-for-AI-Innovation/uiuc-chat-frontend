import React from 'react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function AnthropicProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: AnthropicProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="Anthropic"
      providerKey={ProviderNames.Anthropic}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://console.anthropic.com/settings/keys"
    >
      <form.Field name={`providers.${ProviderNames.Anthropic}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="Anthropic API Key" />
        )}
      </form.Field>
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
