import React from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { Switch, Stack } from '@mantine/core'
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
                    <IconCheck
                      size="0.8rem"
                      color="var(--dashboard-button)"
                      stroke={3}
                    />
                  ) : (
                    <IconX size="0.8rem" color="grey" stroke={3} />
                  )
                }
                styles={{
                  label: {
                    color: 'var(--dashboard-foreground)',
                  },
                  track: {
                    backgroundColor: field.state.value
                      ? 'var(--dashboard-button) !important'
                      : 'var(--dashboard-background-faded)',
                    borderColor: field.state.value
                      ? 'var(--dashboard-button) !important'
                      : 'var(--dashboard-background-faded)',
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
