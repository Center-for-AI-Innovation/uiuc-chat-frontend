import {
  type AllLLMProviders,
  type AnthropicProvider,
  type AzureProvider,
  type LLMProvider,
  type NCSAHostedProvider,
  type NCSAHostedVLMProvider,
  type OllamaProvider,
  type OpenAIProvider,
  type BedrockProvider,
  type GeminiProvider,
  type SambaNovaProvider,
  ProviderNames,
  type WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/routes/anthropic'
import { getWebLLMModels } from '~/utils/modelProviders/WebLLM'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { getOpenAIModels } from '~/utils/modelProviders/routes/openai'
import { ensureRedisConnected } from '~/utils/redisClient'
import { getNCSAHostedVLMModels } from '~/utils/modelProviders/types/NCSAHostedVLM'
import { getBedrockModels } from '~/utils/modelProviders/routes/bedrock'
import { getGeminiModels } from '~/utils/modelProviders/routes/gemini'
import { getSambaNovaModels } from '~/utils/modelProviders/routes/sambanova'

export async function getModels(
  projectName: string,
): Promise<AllLLMProviders | null> {
  // Fetch the project's API keys
  let llmProviders: AllLLMProviders
  const redisClient = await ensureRedisConnected()
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
      case ProviderNames.Bedrock:
        allLLMProviders[providerName] = await getBedrockModels(
          llmProvider as BedrockProvider,
        )
        break
      case ProviderNames.Gemini:
        allLLMProviders[providerName] = await getGeminiModels(
          llmProvider as GeminiProvider,
        )
        break
      case ProviderNames.SambaNova:
        allLLMProviders[providerName] = await getSambaNovaModels(
          llmProvider as SambaNovaProvider,
        )
        break
      default:
        console.warn(`Unhandled provider: ${providerName}`)
    }
  }

  return allLLMProviders as AllLLMProviders
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<AllLLMProviders | { error: string }>,
) {
  try {
    const { projectName } = req.body as {
      projectName: string
    }
    if (!projectName) {
      return res.status(400).json({ error: 'Missing project name' })
    }

    const allLLMProviders = await getModels(projectName)

    return res.status(200).json(allLLMProviders as AllLLMProviders)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: JSON.stringify(error) })
  }
}

export default withAuth(handler)
