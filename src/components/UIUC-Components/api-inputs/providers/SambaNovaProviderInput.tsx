import React from 'react'
import { Text, Switch, Card, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import {
  type SambaNovaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { APIKeyInput } from '../LLMsApiKeyInputForm'

export default function SambaNovaProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: SambaNovaProvider
  form: any
  isLoading: boolean
}) {
  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }

  return (
    <motion.div layout>
      <Card
        p="lg"
        radius="lg"
        className="max-w-[330px] bg-[--dashboard-background-faded] text-[--dashboard-foreground] md:w-[330px] "
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
            <a
              className="mb-3"
              href="https://sambanova.ai/api"
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
                  SambaNova
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.SambaNova}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable SambaNova provider"
                checked={field.state.value}
                onChange={(event) => {
                  event.preventDefault()
                  field.handleChange(event.currentTarget.checked)
                  form.handleSubmit()
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
          (form.state.values?.providers?.SambaNova?.enabled ||
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
        <form.Field name={`providers.${ProviderNames.SambaNova}.enabled`}>
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
                    name={`providers.${ProviderNames.SambaNova}.apiKey`}
                  >
                    {(apiKeyField: any) => (
                      <APIKeyInput
                        field={apiKeyField}
                        placeholder="SambaNova API Key"
                      />
                    )}
                  </form.Field>

                  {form.state.values?.providers?.SambaNova?.apiKey && (
                    <ModelToggles form={form} provider={provider} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field>
      </Card>
    </motion.div>
  )
}
