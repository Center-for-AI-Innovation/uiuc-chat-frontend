import React, { useState } from 'react'
import {
  Text,
  Switch,
  Card,
  Skeleton,
  Button,
  TextInput,
  Input,
  ActionIcon,
} from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { type FieldApi } from '@tanstack/react-form'
import { ModelToggles } from '../ModelToggles'
import {
  type BedrockProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <Text size="xs" color="red">
          {field.state.meta.errors.join(', ')}
        </Text>
      ) : null}
      {field.state.meta.isValidating ? (
        <Text size="xs">Validating...</Text>
      ) : null}
    </>
  )
}

const CredentialInput = ({
  field,
  placeholder,
  onEnterPress,
}: {
  field: any
  placeholder: string
  onEnterPress: () => void
}) => {
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
      <Input.Wrapper id="credential-input" label={placeholder}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <TextInput
            type="password"
            placeholder={placeholder}
            aria-label={placeholder}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            styles={{
              root: {
                flex: 1,
              },
              input: {
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                width: '100%',
              },
              wrapper: {
                width: '100%',
              },
            }}
          />
          <ActionIcon
            size="xs"
            color="red"
            onClick={(e) => {
              e.preventDefault()
              field.handleChange('')
            }}
            style={{ marginLeft: '8px' }}
          >
            <IconX size={12} />
          </ActionIcon>
        </div>
      </Input.Wrapper>
      <FieldInfo field={field} />
    </div>
  )
}

export default function BedrockProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: BedrockProvider
  form: any
  isLoading: boolean
}) {
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) {
    return <Skeleton height={200} width={330} radius={'lg'} />
  }

  const handleSaveCredentials = async () => {
    setIsSaving(true)
    try {
      await form.handleSubmit()
    } finally {
      setIsSaving(false)
    }
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
              href="https://aws.amazon.com/bedrock/"
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
                  Amazon Bedrock
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.Bedrock}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Bedrock provider"
                checked={field.state.value}
                onChange={(event) => {
                  event.preventDefault()
                  field.handleChange(event.currentTarget.checked)
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

        {provider?.error &&
          (form.state.values?.providers?.Bedrock?.enabled ||
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

        <form.Field name={`providers.${ProviderNames.Bedrock}.enabled`}>
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
                    name={`providers.${ProviderNames.Bedrock}.accessKeyId`}
                  >
                    {(field: any) => (
                      <CredentialInput
                        field={field}
                        placeholder="AWS Access Key ID"
                        onEnterPress={handleSaveCredentials}
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name={`providers.${ProviderNames.Bedrock}.secretAccessKey`}
                  >
                    {(field: any) => (
                      <CredentialInput
                        field={field}
                        placeholder="AWS Secret Access Key"
                        onEnterPress={handleSaveCredentials}
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name={`providers.${ProviderNames.Bedrock}.region`}
                  >
                    {(field: any) => (
                      <CredentialInput
                        field={field}
                        placeholder="AWS Region"
                        onEnterPress={handleSaveCredentials}
                      />
                    )}
                  </form.Field>

                  <div className="mt-4 flex justify-start">
                    <Button
                      compact
                      className="bg-purple-800 hover:border-indigo-600 hover:bg-indigo-600"
                      onClick={handleSaveCredentials}
                      loading={isSaving}
                    >
                      Save
                    </Button>
                  </div>

                  {form.state.values?.providers?.Bedrock?.accessKeyId &&
                    form.state.values?.providers?.Bedrock?.secretAccessKey &&
                    form.state.values?.providers?.Bedrock?.region && (
                      <div className="mt-4">
                        <ModelToggles form={form} provider={provider} />
                      </div>
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
