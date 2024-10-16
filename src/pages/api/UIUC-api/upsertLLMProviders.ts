// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { encryptKeyIfNeeded } from '~/utils/crypto'
import {
  ProjectWideLLMProviders,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const requestBody = await req.text()
  let courseName: string
  let llmProviders: ProjectWideLLMProviders

  try {
    const parsedBody = JSON.parse(requestBody)
    courseName = parsedBody.projectName as string
    llmProviders = parsedBody.llmProviders as ProjectWideLLMProviders
  } catch (error) {
    console.error('Error parsing request body:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Check if all required variables are defined
  if (!courseName || !llmProviders || !llmProviders.providers) {
    console.error('Error: Missing required parameters')
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    )
  }

  // Type checking
  if (typeof courseName !== 'string') {
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
    const redisKey = `${courseName}-llms`
    const existingLLMs = (await kv.get(redisKey)) as ProjectWideLLMProviders

    // Ensure all keys are encrypted, then save to DB.
    const processProviders = async () => {
      for (const [providerName, provider] of Object.entries(
        llmProviders.providers,
      )) {
        if (provider && 'apiKey' in provider) {
          // @ts-ignore - stupid.
          llmProviders.providers[
            providerName as keyof typeof llmProviders.providers
          ] = {
            ...provider,
            // @ts-ignore - it's because this function could throw an error. But we don't care about it here.
            apiKey:
              (await encryptKeyIfNeeded(provider.apiKey!)) ?? provider.apiKey,
          }
        } else {
          llmProviders.providers[
            providerName as keyof typeof llmProviders.providers
          ] = provider as any
        }
      }
    }
    await processProviders()

    // Combine the existing metadata with the new metadata, prioritizing the new values
    const combined_llms = { ...existingLLMs, ...llmProviders }

    // Delete all the old providers, they're now nested inside.
    Object.values(ProviderNames).forEach((provider) => {
      delete (combined_llms as any)[provider]
    })

    if (llmProviders.defaultModel) {
      combined_llms.defaultModel = llmProviders.defaultModel
    }

    if (llmProviders.defaultTemp) {
      combined_llms.defaultTemp = llmProviders.defaultTemp
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
