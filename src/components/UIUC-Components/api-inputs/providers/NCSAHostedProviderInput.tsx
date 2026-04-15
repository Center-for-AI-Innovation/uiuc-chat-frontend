import React from 'react'
import { ModelToggles } from '../ModelToggles'
import {
  type NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import ProviderCard from './ProviderCard'

export default function NCSAHostedLLmsProviderInput({
  provider,
  form,
  isLoading,
}: {
  provider: NCSAHostedProvider
  form: any
  isLoading: boolean
}) {
  return (
    <ProviderCard
      providerName="NCSA Hosted LLMs"
      providerKey={ProviderNames.NCSAHosted}
      provider={provider}
      form={form}
      isLoading={isLoading}
      externalUrl="https://ai.ncsa.illinois.edu/"
      description={
        <>
          These models are hosted by the Center for AI Innovation at the
          National Center for Supercomputing Applications. They&apos;re free.
        </>
      }
    >
      <ModelToggles form={form} provider={provider} />
    </ProviderCard>
  )
}
