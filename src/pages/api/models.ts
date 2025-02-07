import {
  type AllLLMProviders,
  type AnthropicProvider,
  type AzureProvider,
  type LLMProvider,
  type NCSAHostedProvider,
  type NCSAHostedVLMProvider,
  type OllamaProvider,
  type OpenAIProvider,
  ProviderNames,
  type WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/routes/anthropic'
import { getWebLLMModels } from '~/utils/modelProviders/WebLLM'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { getOpenAIModels } from '~/utils/modelProviders/routes/openai'
import { redisClient } from '~/utils/redisClient'
import { getNCSAHostedVLMModels } from '~/utils/modelProviders/types/NCSAHostedVLM'

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
    let llmProviders: AllLLMProviders
    const redisValue = await redisClient.get(`${projectName}-llms`)
    if (!redisValue) {
      llmProviders = {} as AllLLMProviders
    } else {
      llmProviders = JSON.parse(redisValue) as AllLLMProviders
    }

    // Define a function to create a placeholder provider with default values
    const createPlaceholderProvider = (
      providerName: ProviderNames,
    ): LLMProvider => ({
      provider: providerName,
      enabled: true,
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
        case ProviderNames.NCSAHostedVLM:
          allLLMProviders[providerName] = await getNCSAHostedVLMModels(
            llmProvider as NCSAHostedVLMProvider,
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
