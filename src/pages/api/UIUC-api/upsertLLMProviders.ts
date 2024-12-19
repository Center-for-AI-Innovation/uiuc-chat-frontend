// upsertCourseMetadata.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'
import { encryptKeyIfNeeded } from '~/utils/crypto'
import {
  AllLLMProviders,
  LLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let courseName: string
  let llmProviders: AllLLMProviders
  let defaultModelID: string
  let defaultTemperature: number

  try {
    const parsedBody = JSON.parse(req.body)
    courseName = parsedBody.projectName as string
    llmProviders = parsedBody.llmProviders as AllLLMProviders
    defaultModelID = parsedBody.defaultModelID as string
    defaultTemperature = parsedBody.defaultTemperature as number
  } catch (error) {
    console.error('Error parsing request body:', error)
    return res.status(400).json({ error: 'Invalid request body' })
  }

  // Check if all required variables are defined
  if (!courseName || !llmProviders || !defaultModelID || !defaultTemperature) {
    console.error('Error: Missing required parameters')
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  // Type checking
  if (
    typeof courseName !== 'string' ||
    typeof defaultModelID !== 'string' ||
    typeof defaultTemperature !== 'string'
  ) {
    console.error('Error: Invalid parameter types')
    return res.status(400).json({ error: 'Invalid parameter types' })
  }

  if (typeof llmProviders !== 'object' || llmProviders === null) {
    console.error('Error: Invalid llmProviders')
    return res.status(400).json({ error: 'Invalid llmProviders' })
  }

  try {
    console.debug('llmProviders BEFORE being cleaned and such', llmProviders)

    const redisKey = `${courseName}-llms`
    const existingLLMs = (await redisClient.get(
      redisKey,
    )) as ProjectWideLLMProviders

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

    // Now await the existing LLMs and combine with encrypted providers
    const combined_llms = { ...existingLLMs, ...llmProviders }

    if (defaultModelID) {
      combined_llms.defaultModel = defaultModelID
    }

    if (defaultTemperature) {
      combined_llms.defaultTemp = defaultTemperature
    }

    console.debug('-----------------------------------------')
    console.debug('EXISTING LLM Providers:', existingLLMs)
    console.debug('passed into upsert LLM Providers:', llmProviders)
    console.debug('FINAL COMBINED LLM Providers:', combined_llms)
    console.debug('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Save the combined metadata
    await redisClient.set(redisKey, JSON.stringify(combined_llms))
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error upserting LLM providers:', error)
    return res.status(500).json({ success: false })
  }
}
