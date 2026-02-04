import React from 'react'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type AzureProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function AzureProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: AzureProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="Azure OpenAI"
      providerKey={ProviderNames.Azure}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/"
    >
      <form.Field name={`providers.${ProviderNames.Azure}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="Azure API Key" />
        )}
      </form.Field>
      <form.Field name={`providers.${ProviderNames.Azure}.AzureEndpoint`}>
        {(field: any) => (
          <div className="mb-3">
            <Label className="text-[--dashboard-foreground-faded]">
              Azure Endpoint
            </Label>
            <Input
              placeholder="https://your-resource-name.openai.azure.com/"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="mt-1 bg-[--background] text-[--foreground]"
            />
          </div>
        )}
      </form.Field>
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
