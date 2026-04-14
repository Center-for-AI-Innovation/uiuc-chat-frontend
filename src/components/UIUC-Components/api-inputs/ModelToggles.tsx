import React from 'react'
import { Switch } from '@/components/shadcn/ui/switch'
import { type LLMProvider } from '~/utils/modelProviders/LLMProvider'

export function ModelToggles({
  form,
  provider,
}: {
  form: any
  provider: LLMProvider
}) {
  const providerModels = provider?.provider
    ? form.state.values.providers[provider.provider]?.models || {}
    : {}

  return (
    <div className="mt-4 flex flex-col gap-2">
      {Object.entries(providerModels).map(
        ([modelId, modelData]: [string, any]) => (
          <form.Field
            key={modelId}
            name={`providers.${provider.provider}.models.${modelId}.enabled`}
          >
            {(field: any) => (
              <Switch
                variant="labeled"
                showLabels
                showThumbIcon
                size="sm"
                label={modelData.name}
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  field.handleChange(checked)
                  // Trigger form submission
                  setTimeout(() => form.handleSubmit(), 0)
                }}
              />
            )}
          </form.Field>
        ),
      )}
    </div>
  )
}
