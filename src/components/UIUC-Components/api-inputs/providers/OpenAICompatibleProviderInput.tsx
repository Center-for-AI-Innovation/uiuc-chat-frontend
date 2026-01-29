import React from 'react'
import { Text, Switch, Card, Skeleton, TextInput } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import {
  type OpenAICompatibleProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { APIKeyInput } from '../LLMsApiKeyInputForm'

export default function OpenAICompatibleProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: OpenAICompatibleProvider
  form: any
  isLoading: boolean
}) {
  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }

  return (
    <motion.div layout>
      <Card
        p="md"
        radius="md"
        className="max-w-[330px] bg-[--dashboard-background-faded] text-[--dashboard-foreground] md:w-[330px]"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div>
            <Text
              size="lg"
              weight={500}
              mb="xs"
              style={{ paddingRight: '8px' }}
            >
              OpenAI Compatible
            </Text>
          </div>
          <form.Field
            name={`providers.${ProviderNames.OpenAICompatible}.enabled`}
          >
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable OpenAI Compatible provider"
                checked={field.state.value}
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
        </div>
        {provider?.error &&
          (form.state.values?.providers?.OpenAICompatible?.enabled ||
            provider.enabled) && (
            <Text
              size="sm"
              color="red"
              mb="md"
              style={{
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
              }}
            >
              {provider.error}
            </Text>
          )}
        <form.Field
          name={`providers.${ProviderNames.OpenAICompatible}.enabled`}
        >
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form.Field
                    name={`providers.${ProviderNames.OpenAICompatible}.baseUrl`}
                  >
                    {(baseUrlField: any) => (
                      <div style={{ marginBottom: '16px' }}>
                        <TextInput
                          label="Base URL"
                          placeholder="https://api.example.com/v1"
                          value={baseUrlField.state.value || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            baseUrlField.handleChange(value)
                            // Validate on change
                            if (value && !value.includes('/v1')) {
                              // Set error in provider
                              form.setFieldValue(
                                `providers.${ProviderNames.OpenAICompatible}.error`,
                                'Base URL must include /v1',
                              )
                            } else {
                              // Clear error
                              form.setFieldValue(
                                `providers.${ProviderNames.OpenAICompatible}.error`,
                                undefined,
                              )
                            }
                          }}
                          onBlur={() => {
                            // Trigger form submission on blur to save
                            setTimeout(() => form.handleSubmit(), 0)
                          }}
                          styles={{
                            input: {
                              color: 'var(--foreground)',
                              backgroundColor: 'var(--background)',
                              padding: '8px',
                              borderRadius: '4px',
                            },
                            label: {
                              color: 'var(--dashboard-foreground-faded)',
                            },
                          }}
                        />
                        {baseUrlField.state.value &&
                          !baseUrlField.state.value.includes('/v1') && (
                            <Text size="xs" color="red" mt="xs">
                              Base URL must include /v1
                            </Text>
                          )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name={`providers.${ProviderNames.OpenAICompatible}.apiKey`}
                  >
                    {(apiKeyField: any) => (
                      <APIKeyInput field={apiKeyField} placeholder="API Key" />
                    )}
                  </form.Field>

                  <ModelToggles form={form} provider={provider} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field>
      </Card>
    </motion.div>
  )
}
