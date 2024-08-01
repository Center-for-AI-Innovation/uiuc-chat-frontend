import { kv } from '@vercel/kv'
import { CourseMetadata } from '~/types/courseMetadata'
import { OpenAIModelID, OpenAIModels } from '@/types/openai'
import { LLMProvider, OpenAIProvider } from '~/types/LLMProvider'
import { OpenAI } from 'openai'

export const config = {
  runtime: 'edge',
}

const tokenLimMAp = new Map([
  ['gpt-3.5-turbo-0125', 16385],
  ['gpt-4-0613', 8192],
  ['gpt-4-turbo-2024-04-09', 128000],
  ['gpt-4o-2024-05-13', 128000],
])

const openAINames = new Map([
  ['gpt-3.5-turbo-0125', 'GPT-3.5 Turbo'],
  ['gpt-4-0613', 'GPT-4'],
  ['gpt-4-turbo-2024-04-09', 'GPT-4 Turbo'],
  ['gpt-4o-2024-05-13', 'GPT 4o'],
])

export const getOpenAIModels = async (
  openAIProvider: OpenAIProvider,
  projectName: string,
): Promise<OpenAIProvider> => {
  try {
    if (!openAIProvider.apiKey) {
      openAIProvider.error = 'OpenAI API Key is not set'
      return openAIProvider
    }

    const client = new OpenAI({
      apiKey: openAIProvider.apiKey,
    })

    const response = await client.models.list()

    if (!response.data) {
      openAIProvider.error = `Error fectching models from OpenAI, unexpected response format. Response: ${response}`
    }

    const disabledModels = await getDisabledOpenAIModels({ projectName })

    // Iterate through the models
    const openAIModels = response.data
      .filter((model: any) => Object.values(OpenAIModelID).includes(model.id))
      .map((model: any) => {
        return {
          id: model.id,
          name: OpenAIModels[model.id as OpenAIModelID].name,
          tokenLimit: OpenAIModels[model.id as OpenAIModelID].tokenLimit,
          enabled: !disabledModels.includes(model.id),
        }
      })

    openAIProvider.models = openAIModels
    return openAIProvider
  } catch (error: any) {
    console.error('Error fetching models:', error)
    openAIProvider.error = error.message
    return openAIProvider
  }
}

const getDisabledOpenAIModels = async ({
  projectName,
}: {
  projectName: string
}): Promise<string[]> => {
  /* 
  returns just the model IDs.
  */

  const course_metadata = (await kv.hget(
    'course_metadatas',
    projectName,
  )) as CourseMetadata

  if (course_metadata && course_metadata.disabled_models) {
    // returns just the model IDs
    return course_metadata.disabled_models
  } else {
    // All models are enabled
    return []
  }
}
