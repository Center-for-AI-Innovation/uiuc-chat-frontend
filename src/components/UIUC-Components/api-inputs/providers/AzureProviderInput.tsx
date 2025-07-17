import React from 'react'
import { Text, Switch, Card, TextInput, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import {
  AzureProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'next-i18next'

export default function AzureProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: AzureProvider
  form: any
  isLoading: boolean
}) {
  const { t } = useTranslation('common')
  
  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }
  
  return (
    <motion.div layout>
      <Card
        shadow="sm"
        p="lg"
        radius="lg"
        className="max-w-[330px] bg-[#15162c] md:w-[330px]"
      >
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
              href="https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/"
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
                  Azure OpenAI
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.Azure}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Azure OpenAI provider"
                checked={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.currentTarget.checked)
                  form.handleSubmit() // Trigger form submission
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
        
        {provider?.error &&
          (form.state.values?.providers?.Azure?.enabled ||
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
          
        <form.Field name={`providers.${ProviderNames.Azure}.enabled`}>
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form.Field name={`providers.${ProviderNames.Azure}.apiKey`}>
                    {(field: any) => (
                      <APIKeyInput field={field} placeholder={t('azure_api_key')} />
                    )}
                  </form.Field>
                  <form.Field
                    name={`providers.${ProviderNames.Azure}.AzureEndpoint`}
                  >
                    {(field: any) => (
                      <TextInput
                        label={t('azure_endpoint')}
                        placeholder={t('azure_endpoint_placeholder')}
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                      />
                    )}
                  </form.Field>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field>
      </Card>
    </motion.div>
  )
}