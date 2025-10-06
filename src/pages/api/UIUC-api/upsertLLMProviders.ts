// upsertCourseMetadata.ts
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { type ProjectWideLLMProviders } from '~/types/courseMetadata'
import { encryptKeyIfNeeded } from '~/utils/crypto'
import {
  type AllLLMProviders,
  type LLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { ensureRedisConnected } from '~/utils/redisClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let courseName: string
  let llmProviders: AllLLMProviders
  const redisClient = await ensureRedisConnected()

  try {
    courseName = req.body.projectName as string
    llmProviders = req.body.llmProviders as AllLLMProviders
  } catch (error) {
    console.error('Error parsing request body:', error)
    return res.status(400).json({ error: 'Invalid request body' })
  }

  // Check if all required variables are defined
  if (!courseName || !llmProviders) {
    console.error('Error: Missing required parameters')
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  // Type checking
  if (typeof courseName !== 'string') {
    console.error('Error: Invalid parameter types')
    return res.status(400).json({ error: 'Invalid parameter types' })
  }

  if (typeof llmProviders !== 'object' || llmProviders === null) {
    console.error('Error: Invalid llmProviders')
    return res.status(400).json({ error: 'Invalid llmProviders' })
  }

  try {
    // ⚠️ Must JSON.parse the redis data!
    const redisKey = `${courseName}-llms`
    const existingLLMs = JSON.parse(
      (await redisClient.get(redisKey)) || '{}',
    ) as ProjectWideLLMProviders

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

export default withCourseOwnerOrAdminAccess()(handler)
