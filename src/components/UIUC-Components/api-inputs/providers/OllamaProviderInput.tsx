import React from 'react'
import { Text, Switch, Card, TextInput, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import {
  OllamaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function OllamaProviderInput({
  form,
  provider,
  isLoading,
}: {
  form: any
  provider: OllamaProvider
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
              href="https://ollama.ai/"
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
                  Ollama
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.Ollama}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Ollama provider"
                checked={field.state.value}
                onChange={(event) => {
                  const newValue = event.currentTarget.checked
                  field.handleChange(newValue)
                  provider.enabled = newValue

                  if (form.state.values.defaultModel && form.state.values.defaultModel.provider === ProviderNames.Ollama) {
                    form.setFieldValue('defaultModel', newValue ? form.state.values.defaultModel : null)
                  }

                  // Trigger form submission
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
        <Text size="sm" color="dimmed" mb="md">
          Ollama allows you easily self host LLMs. Set up Ollama on your machine
          and provide the base URL. Note that only the following models are
          supported, email us if you&apos;d like any others:{' '}
          <code>llama3.1:8b</code>, <code>llama3.1:70b</code>,{' '}
          <code>llama3.1:405b</code>.
        </Text>
        {provider?.error &&
          (form.state.values?.providers?.Ollama?.enabled ||
            provider.enabled) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Text
                size="sm"
                color="red"
                mb="md"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 0, 0, 0.2)',
                  wordBreak: 'break-all', // Add this line
                  overflowWrap: 'break-word', // Add this line for better compatibility
                }}
              >
                {provider.error}
              </Text>
            </motion.div>
          )}
        <form.Field name={`providers.${ProviderNames.Ollama}.enabled`}>
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
                    name={`providers.${ProviderNames.Ollama}.baseUrl`}
                  >
                    {(field: any) => (
                      <TextInput
                        label="Base URL"
                        placeholder="http://your-domain.com"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
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
