import React from 'react'
import { Text, Switch, Card, TextInput, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import {
  type OllamaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'next-i18next'

export default function OllamaProviderInput({
  form,
  provider,
  isLoading,
}: {
  form: any
  provider: OllamaProvider
  isLoading: boolean
}) {
  const { t } = useTranslation('common')
  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }
  return (
    <motion.div layout>
      <Card
        p="lg"
        radius="lg"
        className="max-w-[330px] bg-[--dashboard-background-faded] text-[--dashboard-foreground] md:w-[330px]"
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
                  {t('models.ollama.title')}
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
                onLabel={t('models.on')}
                offLabel={t('models.off')}
                aria-label={t('models.enable_model', { model: 'Ollama' })}
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
        <Text size="sm" color="dimmed" mb="md">
          {t('models.ollama.description')}
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
                        label={t('models.fields.base_url')}
                        placeholder={t('models.fields.base_url_placeholder')}
                        value={field.state.value}
                        styles={{
                          input: {
                            color: 'var(--foreground)',
                            backgroundColor: 'var(--background)',
                          },
                        }}
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
