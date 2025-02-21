import React from 'react'
import { Card, Switch, Title, Text } from '@mantine/core'
import { type FieldApi } from '@tanstack/react-form'
import { type AllLLMProviders, type SambaNovaProvider } from '~/utils/modelProviders/LLMProvider'
import { APIKeyInput } from '../LLMsApiKeyInputForm'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IconInfoCircle } from '@tabler/icons-react'

interface SambaNovaProviderInputProps {
  provider: SambaNovaProvider | undefined
  form: any // Using any here since the form type is complex and not exported correctly
  isLoading: boolean
}

const SambaNovaProviderInput: React.FC<SambaNovaProviderInputProps> = ({
  provider,
  form,
  isLoading,
}) => {
  if (!provider || isLoading) return null

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        backgroundColor: '#15162c',
        width: '100%',
        maxWidth: '450px',
        minWidth: '350px',
      }}
    >
      <div className="flex items-center justify-between">
        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          order={4}
        >
          SambaNova
        </Title>
        <form.Field
          name={`providers.SambaNova.enabled`}
          defaultValue={provider.enabled}
        >
          {(field: FieldApi<any, any, any, any>) => (
            <Switch
              checked={field.state.value}
              onChange={(event) => {
                field.handleChange(event.currentTarget.checked)
                field.form.handleSubmit()
              }}
              color="violet"
              size="md"
            />
          )}
        </form.Field>
      </div>

      {provider.enabled && (
        <>
          <Text
            className={`${montserrat_paragraph.variable} mt-4 font-montserratParagraph`}
            size="sm"
          >
            Enter your SambaNova API key to enable SambaNova models.
          </Text>

          <div className="mt-4">
            <form.Field
              name={`providers.SambaNova.apiKey`}
              defaultValue={provider.apiKey}
            >
              {(field: FieldApi<any, any, any, any>) => (
                <APIKeyInput
                  field={field}
                  placeholder="Enter your SambaNova API key"
                />
              )}
            </form.Field>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <IconInfoCircle size={20} className="mt-0.5 min-w-[20px]" />
            <Text
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              size="sm"
              color="dimmed"
            >
              Get your API key from the{' '}
              <a
                href="https://sambanova.ai/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                SambaNova API dashboard
              </a>
              .
            </Text>
          </div>
        </>
      )}
    </Card>
  )
}

export default SambaNovaProviderInput 