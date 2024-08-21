import {
  AllSupportedModels,
  LLMProvider,
  ProviderNames,
} from '~/types/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { parseOpenaiKey } from '~/utils/crypto'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const { projectName, openAIApiKey } = (await req.json()) as {
      projectName: string
      openAIApiKey?: string
    }

    if (!projectName) {
      return new Response('Missing project name', { status: 400 })
    }

    let apiKey: string | undefined
    if (openAIApiKey) {
      apiKey = await parseOpenaiKey(openAIApiKey)
    }

    // TODO: MOVE THESE TO DB INPUTS
    // const AzureProvider: LLMProvider = {
    //   provider: ProviderNames.Azure,
    //   enabled: true,
    //   apiKey: process.env.AZURE_API_KEY, // this is the azure api key
    //   AzureDeployment: 'gpt-35-turbo-16k',
    //   AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/',
    // }

    // const AnthropicProvider: LLMProvider = {
    //   provider: ProviderNames.Anthropic,
    //   enabled: true,
    //   apiKey: process.env.ANTHROPIC_API_KEY, // this is the anthropic api key
    //   AnthropicModel: 'claude-3-opus-20240229',
    // }

    const ollamaProvider: LLMProvider = {
      provider: ProviderNames.Ollama,
      enabled: true,
      baseUrl: process.env.OLLAMA_SERVER_URL,
    }

    // TODO: update this to come from input.
    const OpenAIProvider: LLMProvider = {
      provider: ProviderNames.OpenAI,
      enabled: true,
      apiKey: apiKey,
    }

    const WebLLMProvider: LLMProvider = {
      provider: ProviderNames.WebLLM,
      enabled: true,
    }

    const llmProviderKeys: LLMProvider[] = [
      ollamaProvider,
      OpenAIProvider,
      WebLLMProvider,
      // AzureProvider,
      // AnthropicProvider,
    ]
    // END-TODO: MOVE THESE TO DB INPUTS

    const allLLMProviders: { [key in ProviderNames]?: LLMProvider } = {}
    for (const llmProvider of llmProviderKeys) {
      if (!llmProvider.enabled) {
        continue
      }
      if (llmProvider.provider == ProviderNames.Ollama) {
        allLLMProviders[llmProvider.provider] =
          await getOllamaModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.OpenAI) {
        allLLMProviders[llmProvider.provider] = await getOpenAIModels(
          llmProvider,
          projectName,
        )
      } else if (llmProvider.provider == ProviderNames.Azure) {
        allLLMProviders[llmProvider.provider] =
          await getAzureModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.Anthropic) {
        allLLMProviders[llmProvider.provider] =
          await getAnthropicModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.WebLLM) {
        llmProvider.models = webLLMModels
        allLLMProviders[llmProvider.provider] = llmProvider
      } else {
        continue
      }
    }

    return new Response(JSON.stringify(allLLMProviders), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
