import {
  AllLLMProviders,
  AnthropicProvider,
  AnySupportedModel,
  AzureProvider,
  LLMProvider,
  NCSAHostedProvider,
  OllamaProvider,
  OpenAIProvider,
  ProjectWideLLMProviders,
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

export const config = {
  runtime: 'edge',
}
export const maxDuration = 60

const handler = async (
  req: NextRequest,
): Promise<NextResponse<ProjectWideLLMProviders | { error: string }>> => {
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

    // Define a function to create a placeholder provider
    const createPlaceholderProvider = (
      providerName: ProviderNames,
    ): LLMProvider => ({
      provider: providerName,
      enabled: false,
      models: [],
    })

    // Fetch the project's API keys, filtering out all keys if requested
    const llmProviders = (await kv.get(
      `${projectName}-llms`,
    )) as unknown as ProjectWideLLMProviders

    // Ensure all providers are defined
    const allProviderNames = Object.values(ProviderNames)
    for (const providerName of allProviderNames) {
      if (!llmProviders.providers) {
        llmProviders.providers = {} as any
      }

      if (!llmProviders.providers[providerName]) {
        // console.log("creating placeholder provider:", providerName);
        // @ts-ignore - ignored for now
        if (llmProviders[providerName]) {
          // @ts-ignore - ignored for now
          llmProviders.providers[providerName] = llmProviders[providerName]
          // console.log("adding pre-existing provider:", llmProviders.providers[providerName]);
        } else {
          llmProviders.providers[providerName] = createPlaceholderProvider(
            providerName,
          ) as any
        }
      }
    }

    // Iterate through all possible providers
    for (const providerName of Object.values(ProviderNames)) {
      const llmProvider = llmProviders.providers[providerName]

      switch (providerName) {
        case ProviderNames.Ollama:
          llmProviders.providers[providerName] = (await getOllamaModels(
            llmProvider as OllamaProvider,
          )) as OllamaProvider
          break
        case ProviderNames.OpenAI:
          llmProviders.providers[providerName] = await getOpenAIModels(
            llmProvider as OpenAIProvider,
            projectName,
          )
          break
        case ProviderNames.Azure:
          llmProviders.providers[providerName] = await getAzureModels(
            llmProvider as AzureProvider,
          )
          break
        case ProviderNames.Anthropic:
          llmProviders.providers[providerName] = await getAnthropicModels(
            llmProvider as AnthropicProvider,
          )
          break
        case ProviderNames.WebLLM:
          llmProviders.providers[providerName] = await getWebLLMModels(
            llmProvider as WebLLMProvider,
          )
          break
        case ProviderNames.NCSAHosted:
          llmProviders.providers[providerName] = await getNCSAHostedModels(
            llmProvider as NCSAHostedProvider,
          )
          break
        default:
          console.warn(`Unhandled provider: ${providerName}`)
      }
    }

    // console.log('FINAL -- llmProviders', llmProviders)
    return NextResponse.json(llmProviders as ProjectWideLLMProviders, {
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 })
  }
}

export default handler
