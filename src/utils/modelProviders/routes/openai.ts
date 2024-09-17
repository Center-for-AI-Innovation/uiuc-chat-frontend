import { CourseMetadata } from '~/types/courseMetadata'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import { OpenAIModelID, OpenAIModels, OpenAIProvider } from '../types/openai'
import OpenAI from 'openai'
import { kv } from '@vercel/kv'
import { ProviderNames } from '../LLMProvider'

export const getOpenAIModels = async (
  openAIProvider: OpenAIProvider,
  projectName: string,
): Promise<OpenAIProvider> => {
  try {
    delete openAIProvider.error // Remove the error property if it exists
    openAIProvider.provider = ProviderNames.OpenAI
    // Priority #1: use passed in key
    // Priority #2: use the key from the course metadata
    // const { disabledModels, openaiAPIKey } = await getDisabledOpenAIModels({
    //   projectName,
    // })

    // if (!openAIProvider.apiKey) {
    //   openAIProvider.apiKey = openaiAPIKey
    // }

    // 1. Use all passed-in models that are ALSO available from the endpoint...
    // If no passed-in models, then use all. Enabled by default, following our types spec.

    if (!openAIProvider.apiKey || openAIProvider.apiKey === undefined) {
      // No error here, too confusing for users.
      // openAIProvider.error = 'OpenAI API Key is not set.'
      openAIProvider.models = [] // clear any previous models.
      return openAIProvider
    }

    const client = new OpenAI({
      apiKey: await decryptKeyIfNeeded(openAIProvider.apiKey),
    })

    const response = await client.models.list()

    if (!response.data) {
      openAIProvider.error = `Error fetching models from OpenAI, unexpected response format. Response: ${response}`
    }

    // Iterate through the models
    const openAIModels = response.data
      .filter((model: any) => Object.values(OpenAIModelID).includes(model.id))
      .map((model: any) => {
        return {
          id: model.id,
          name: OpenAIModels[model.id as OpenAIModelID].name,
          tokenLimit: OpenAIModels[model.id as OpenAIModelID].tokenLimit,
          enabled:
            openAIProvider.models?.find((m) => m.id === model.id)?.enabled ??
            OpenAIModels[model.id as OpenAIModelID].enabled,
        }
      })

    openAIProvider.models = openAIModels
    return openAIProvider
  } catch (error: any) {
    console.warn('Error fetching OpenAImodels:', error)
    openAIProvider.error = error.message
    openAIProvider.models = [] // clear any previous models.
    return openAIProvider
  }
}

// type DisabledOpenAIModels = {
//   disabledModels: string[]
//   openaiAPIKey: string | undefined
// }

// const getDisabledOpenAIModels = async ({
//   projectName,
// }: {
//   projectName: string
// }): Promise<DisabledOpenAIModels> => {
//   /*
//   returns just the model IDs.
//   */

//   const course_metadata = (await kv.hget(
//     'course_metadatas',
//     projectName,
//   )) as CourseMetadata

//   let apiKey: string | undefined = undefined
//   if (course_metadata.openai_api_key) {
//     apiKey = await decryptKeyIfNeeded(course_metadata.openai_api_key)
//   }

//   if (course_metadata && course_metadata.disabled_models) {
//     // returns just the model IDs
//     return {
//       disabledModels: course_metadata.disabled_models,
//       openaiAPIKey: apiKey,
//     }
//   } else {
//     // All models are enabled
//     return { disabledModels: [], openaiAPIKey: apiKey }
//   }
// }
