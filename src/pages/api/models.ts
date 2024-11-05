import {
  AllLLMProviders,
  AnthropicProvider,
  AzureProvider,
  LLMProvider,
  NCSAHostedProvider,
  OllamaProvider,
  OpenAIProvider,
  ProviderNames,
  WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/routes/anthropic'
import { getWebLLMModels } from '~/utils/modelProviders/WebLLM'
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { getOpenAIModels } from '~/utils/modelProviders/routes/openai'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'

export const config = {
  runtime: 'edge',
}

const handler = async (
  req: NextRequest,
): Promise<NextResponse<AllLLMProviders | { error: string }>> => {
  try {
    const { projectName } = (await req.json()) as {
      projectName: string
    }

    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing project name' },
        { status: 400 },
      )
    }

    // Fetch the project's API keys
    let llmProviders = (await kv.get(
      `${projectName}-llms`,
    )) as AllLLMProviders | null

    if (!llmProviders) {
      llmProviders = {} as AllLLMProviders
    } else {
      llmProviders = llmProviders as AllLLMProviders
    }

    // Define a function to create a placeholder provider with default values
    const createPlaceholderProvider = (
      providerName: ProviderNames,
    ): LLMProvider => ({
      provider: providerName,
      enabled: false,
      models: [],
    })

    // Ensure all providers are defined
    const allProviderNames = Object.values(ProviderNames)
    for (const providerName of allProviderNames) {
      if (!llmProviders[providerName]) {
        // @ts-ignore -- I can't figure out why Ollama complains about undefined.
        llmProviders[providerName] = createPlaceholderProvider(providerName)
      }
    }

    const allLLMProviders: Partial<AllLLMProviders> = {}

    // Iterate through all possible providers
    for (const providerName of Object.values(ProviderNames)) {
      const llmProvider = llmProviders[providerName]

      switch (providerName) {
        case ProviderNames.Ollama:
          allLLMProviders[providerName] = (await getOllamaModels(
            llmProvider as OllamaProvider,
          )) as OllamaProvider
          break
        case ProviderNames.OpenAI:
          allLLMProviders[providerName] = await getOpenAIModels(
            llmProvider as OpenAIProvider,
            projectName,
          )
          break
        case ProviderNames.Azure:
          allLLMProviders[providerName] = await getAzureModels(
            llmProvider as AzureProvider,
          )
          break
        case ProviderNames.Anthropic:
          allLLMProviders[providerName] = await getAnthropicModels(
            llmProvider as AnthropicProvider,
          )
          break
        case ProviderNames.WebLLM:
          allLLMProviders[providerName] = await getWebLLMModels(
            llmProvider as WebLLMProvider,
          )
          break
        case ProviderNames.NCSAHosted:
          allLLMProviders[providerName] = await getNCSAHostedModels(
            llmProvider as NCSAHostedProvider,
          )
          break
        default:
          console.warn(`Unhandled provider: ${providerName}`)
      }
    }

    console.log('FINAL -- allLLMProviders', allLLMProviders)
    return NextResponse.json(allLLMProviders as AllLLMProviders, {
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 })
  }
}

export default handler
