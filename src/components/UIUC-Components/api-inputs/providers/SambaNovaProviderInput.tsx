import React from 'react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type SambaNovaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function SambaNovaProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: SambaNovaProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="SambaNova"
      providerKey={ProviderNames.SambaNova}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://sambanova.ai/api"
    >
      <form.Field name={`providers.${ProviderNames.SambaNova}.apiKey`}>
        {(apiKeyField: any) => (
          <APIKeyInput field={apiKeyField} placeholder="SambaNova API Key" />
        )}
      </form.Field>
      {form.state.values?.providers?.SambaNova?.apiKey && (
        <ModelToggles form={form} provider={provider} />
      )}
    </ProviderCard>
  )
}
