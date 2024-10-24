// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'
import { encryptKeyIfNeeded } from '~/utils/crypto'
import {
  AllLLMProviders,
  LLMProvider,
} from '~/utils/modelProviders/LLMProvider'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const requestBody = await req.text()
  let courseName: string
  let llmProviders: AllLLMProviders
  let defaultModelID: string
  let defaultTemperature: number

  try {
    const parsedBody = JSON.parse(requestBody)
    courseName = parsedBody.projectName as string
    llmProviders = parsedBody.llmProviders as AllLLMProviders
    defaultModelID = parsedBody.defaultModelID as string
    defaultTemperature = parsedBody.defaultTemperature as number
  } catch (error) {
    console.error('Error parsing request body:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Check if all required variables are defined
  if (!courseName || !llmProviders) {
    console.error('Error: Missing required parameters')
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    )
  }

  // Type checking
  if (
    typeof courseName !== 'string' ||
    typeof defaultModelID !== 'string' ||
    typeof defaultTemperature !== 'string'
  ) {
    console.error('Error: Invalid parameter types')
    return NextResponse.json(
      { error: 'Invalid parameter types' },
      { status: 400 },
    )
  }

  if (typeof llmProviders !== 'object' || llmProviders === null) {
    console.error('Error: Invalid llmProviders')
    return NextResponse.json({ error: 'Invalid llmProviders' }, { status: 400 })
  }

  try {
    console.debug('llmProviders BEFORE being cleaned and such', llmProviders)

    const redisKey = `${courseName}-llms`
    const existingLLMs = (await kv.get(redisKey)) as AllLLMProviders

    // Ensure all keys are encrypted, then save to DB.
    const processProviders = async () => {
      for (const providerName in llmProviders) {
        const typedProviderName = providerName as keyof AllLLMProviders
        const provider = llmProviders[typedProviderName]
        if (provider && 'apiKey' in provider) {
          llmProviders[typedProviderName] = {
            ...provider,
            apiKey:
              (await encryptKeyIfNeeded(provider.apiKey!)) ?? provider.apiKey,
          } as LLMProvider & { provider: typeof typedProviderName }
        }
      }
    }
    await processProviders()

    // Combine the existing metadata with the new metadata, prioritizing the new values
    const combined_llms = { ...existingLLMs, ...llmProviders }

    if (defaultModelID) {
      Object.values(combined_llms).forEach(provider => {
        if (provider && provider.models) {
          provider.models.forEach(model => {
            if (model.id === defaultModelID) {
              model.default = true;
              model.temperature = defaultTemperature
            } else if (model.default) {
              model.default = false;
            }
          });
        }
      });
    }

    console.debug('-----------------------------------------')
    console.debug('EXISTING LLM Providers:', existingLLMs)
    console.debug('passed into upsert LLM Providers:', llmProviders)
    console.debug('FINAL COMBINED LLM Providers:', combined_llms)
    console.debug('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Save the combined metadata
    await kv.set(redisKey, combined_llms)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
