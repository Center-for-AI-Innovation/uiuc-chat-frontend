import React from 'react'
import { Text, Switch, Card, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function AnthropicProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: AnthropicProvider
  form: any
  isLoading: boolean
}) {
  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }
  return (
    <motion.div layout>
      <Card shadow="sm" p="lg" radius="lg" className="w-[310px] bg-[#15162c]">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <a
              className="mb-3"
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text
                  size="lg"
                  weight={500}
                  mb="xs"
                  style={{ paddingRight: '8px' }}
                >
                  Anthropic
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.Anthropic}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Anthropic provider"
                checked={field.state.value}
                onChange={(event) => {
                  event.preventDefault()
                  const newValue = event.currentTarget.checked
                  field.handleChange(newValue)
                  provider.enabled = newValue
                  form.handleSubmit()
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
        </div>
        {/* <Text size="sm" color="dimmed" mb="md">
          Anthropic provides advanced AI models like Claude. Sign up on their
          website to get an API key.
        </Text> */}
        {provider?.error &&
          (form.state.values?.providers?.Anthropic?.enabled ||
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
        <form.Field name={`providers.${ProviderNames.Anthropic}.enabled`}>
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
                    name={`providers.${ProviderNames.Anthropic}.apiKey`}
                  >
                    {(field: any) => (
                      <APIKeyInput
                        field={field}
                        placeholder="Anthropic API Key"
                        // onValidate={validateApiKey}
                      />
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
