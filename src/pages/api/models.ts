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
import { NextApiRequest, NextApiResponse } from 'next'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { getOpenAIModels } from '~/utils/modelProviders/routes/openai'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AllLLMProviders | { error: string }>,
) {
  try {
    const { projectName } = req.body as {
      projectName: string
    }

    if (!projectName) {
      return res.status(400).json({ error: 'Missing project name' })
    }

    // Fetch the project's API keys
    let llmProviders: ProjectWideLLMProviders
    const redisValue = await redisClient.get(`${projectName}-llms`)
    if (!redisValue) {
      llmProviders = {} as ProjectWideLLMProviders
    } else {
      llmProviders = JSON.parse(redisValue) as ProjectWideLLMProviders
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

    // Ensure defaultModel and defaultTemp are set
    if (!llmProviders.defaultModel) {
      llmProviders.defaultModel = OpenAIModelID.GPT_4o_mini
    }
    if (!llmProviders.defaultTemp) {
      llmProviders.defaultTemp = 0.1
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

    return res.status(200).json(allLLMProviders as AllLLMProviders)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: JSON.stringify(error) })
  }
}
