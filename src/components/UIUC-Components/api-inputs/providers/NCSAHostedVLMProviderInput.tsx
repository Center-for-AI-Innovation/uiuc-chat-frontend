import React from 'react'
import { ModelToggles } from '../ModelToggles'
import {
  type NCSAHostedVLMProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function NCSAHostedVLMProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: NCSAHostedVLMProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="NCSA Hosted VLMs"
      providerKey={ProviderNames.NCSAHostedVLM}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://ai.ncsa.illinois.edu/"
      description="Vision Language Models hosted by NCSA. These models can understand and analyze images in addition to text. Free for UIUC students."
    >
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
