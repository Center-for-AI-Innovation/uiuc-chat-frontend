import React from 'react'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { ModelToggles } from '../ModelToggles'
import {
  type OllamaProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function OllamaProviderInput({
  form,
  provider,
  isLoading,
}: {
  form: any
  provider: OllamaProvider
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="Ollama"
      providerKey={ProviderNames.Ollama}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://ollama.ai/"
      description={
        <>
          Ollama allows you easily self host LLMs. Set up Ollama on your machine
          and provide the base URL. Note that only the following models are
          supported, email us if you&apos;d like any others:{' '}
          <code>llama3.1:8b</code>, <code>llama3.1:70b</code>,{' '}
          <code>llama3.1:405b</code>.
        </>
      }
    >
      <form.Field name={`providers.${ProviderNames.Ollama}.baseUrl`}>
        {(field: any) => (
          <div className="mb-3">
            <Label className="text-[--dashboard-foreground-faded]">
              Base URL
            </Label>
            <Input
              placeholder="http://your-domain.com"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="mt-1 bg-[--background] text-[--foreground]"
            />
          </div>
        )}
      </form.Field>
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
