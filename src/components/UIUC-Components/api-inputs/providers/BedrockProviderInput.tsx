import React, { useState } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { ModelToggles } from '../ModelToggles'
import {
  type BedrockProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'
import { CredentialInput } from './CredentialInput'

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

  const handleSaveCredentials = async () => {
    setIsSaving(true)
    try {
      await form.handleSubmit()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProviderCard
      providerName="Amazon Bedrock"
      providerKey={ProviderNames.Bedrock}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://aws.amazon.com/bedrock/"
    >
      <form.Field name={`providers.${ProviderNames.Bedrock}.accessKeyId`}>
        {(field: any) => (
          <CredentialInput field={field} placeholder="AWS Access Key ID" />
        )}
      </form.Field>

      <form.Field name={`providers.${ProviderNames.Bedrock}.secretAccessKey`}>
        {(field: any) => (
          <CredentialInput field={field} placeholder="AWS Secret Access Key" />
        )}
      </form.Field>

      <form.Field name={`providers.${ProviderNames.Bedrock}.region`}>
        {(field: any) => (
          <CredentialInput field={field} placeholder="AWS Region" />
        )}
      </form.Field>

      <div className="mt-4 flex justify-start">
        <Button
          className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
          size="sm"
          onClick={handleSaveCredentials}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {form.state.values?.providers?.Bedrock?.accessKeyId &&
        form.state.values?.providers?.Bedrock?.secretAccessKey &&
        form.state.values?.providers?.Bedrock?.region && (
          <div className="mt-4">
            <ModelToggles form={form} provider={provider} />
          </div>
        )}
    </ProviderCard>
  )
}
