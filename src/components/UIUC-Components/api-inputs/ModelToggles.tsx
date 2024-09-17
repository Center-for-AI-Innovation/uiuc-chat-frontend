import React from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { Switch, Stack } from '@mantine/core'
import { LLMProvider } from '~/utils/modelProviders/LLMProvider'

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

  console.log(`${provider.provider} PROV Models`, providerModels)
  console.log(`${provider.provider} PROV.models here`, provider.models)

  return (
    <Stack mt="md">
      {Object.entries(providerModels).map(
        ([modelId, modelData]: [string, any]) => (
          <form.Field
            key={modelId}
            name={`providers.${provider.provider}.models.${modelId}.enabled`}
          >
            {(field: any) => (
              <Switch
                label={modelData.name}
                checked={field.state.value}
                onLabel="ON"
                offLabel="OFF"
                onChange={(event) => {
                  field.handleChange(event.currentTarget.checked)
                  // Trigger form submission
                  setTimeout(() => form.handleSubmit(), 0)
                }}
                thumbIcon={
                  field.state.value ? (
                    <IconCheck size="0.8rem" color="purple" stroke={3} />
                  ) : (
                    <IconX size="0.8rem" color="grey" stroke={3} />
                  )
                }
                styles={{
                  track: {
                    backgroundColor: field.state.value
                      ? '#6a29a4 !important'
                      : '#25262b',
                    borderColor: field.state.value
                      ? '#6a29a4 !important'
                      : '#25262b',
                  },
                }}
              />
            )}
          </form.Field>
        ),
      )}
    </Stack>
  )
}
