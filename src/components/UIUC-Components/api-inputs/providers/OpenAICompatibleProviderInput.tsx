import React from 'react'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  type OpenAICompatibleProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function OpenAICompatibleProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: OpenAICompatibleProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="OpenAI Compatible"
      providerKey={ProviderNames.OpenAICompatible}
      provider={provider}
      form={form}
      isLoading={isLoading}
    >
      <form.Field name={`providers.${ProviderNames.OpenAICompatible}.baseUrl`}>
        {(baseUrlField: any) => (
          <div className="mb-4">
            <Label
              htmlFor="openai-compatible-base-url"
              className="text-[--dashboard-foreground-faded]"
            >
              Base URL
            </Label>
            <Input
              id="openai-compatible-base-url"
              placeholder="https://api.example.com/v1"
              value={baseUrlField.state.value || ''}
              onChange={(e) => {
                const value = e.target.value
                baseUrlField.handleChange(value)
                if (value && !value.includes('/v1')) {
                  form.setFieldValue(
                    `providers.${ProviderNames.OpenAICompatible}.error`,
                    'Base URL must include /v1',
                  )
                } else {
                  form.setFieldValue(
                    `providers.${ProviderNames.OpenAICompatible}.error`,
                    undefined,
                  )
                }
              }}
              onBlur={() => {
                form.handleSubmit()
              }}
              className="mt-1 bg-[--background] text-[--foreground]"
            />
            {baseUrlField.state.value &&
              !baseUrlField.state.value.includes('/v1') && (
                <p className="mt-1 text-xs text-red-500">
                  Base URL must include /v1
                </p>
              )}
          </div>
        )}
      </form.Field>

      <form.Field name={`providers.${ProviderNames.OpenAICompatible}.apiKey`}>
        {(apiKeyField: any) => (
          <APIKeyInput field={apiKeyField} placeholder="API Key" />
        )}
      </form.Field>

      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
