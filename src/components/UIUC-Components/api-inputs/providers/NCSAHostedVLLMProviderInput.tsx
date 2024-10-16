import React from 'react'
import { Text, Switch, Card, Skeleton, Badge } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import {
  NCSAHostedVLLMProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function NCSAHostedVLLMProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: NCSAHostedVLLMProvider
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
              href="https://ai.ncsa.illinois.edu/"
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
                  NCSA Hosted VLMs
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field
            name={`providers.${ProviderNames.NCSAHostedVLLM}.enabled`}
          >
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable NCSA Hosted VLM provider"
                checked={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.currentTarget.checked)
                  provider.enabled = event.currentTarget.checked

                  if (form.state.values.defaultModel && form.state.values.defaultModel.provider === ProviderNames.NCSAHostedVLLM) {
                    form.setFieldValue('defaultModel', event.currentTarget.checked ? form.state.values.defaultModel : null)
                  }

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
        <Badge color="red">Experimental</Badge>
        <div className="pb-2"></div>
        <Text size="sm" color="dimmed" mb="md">
          Llama 3.2 Vision has certain limitations, like no native support for a
          System Message. So we hack a system message into the user&apos;s
          message. It may struggle with following instructions. Furthermore,
          sometimes the model can go offline.
        </Text>
        {provider?.error &&
          (form.state.values?.providers?.NCSAHostedVLLM?.enabled ||
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
        <form.Field name={`providers.${ProviderNames.NCSAHostedVLLM}.enabled`}>
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
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
