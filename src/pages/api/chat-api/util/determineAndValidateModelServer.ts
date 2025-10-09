import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
import { getModels } from '~/pages/api/models'
import type { AllLLMProviders, GenericSupportedModel } from '~/utils/modelProviders/LLMProvider'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'

/**
 * Server-side function to fetch course metadata.
 * @param course_name The name of the course.
 * @returns The course metadata.
 */
export async function determineAndValidateModelServer(
  modelId: string,
  projectName: string,
): Promise<any> {
  const modelsWithProviders = await getModels(projectName) as AllLLMProviders

  const availableModels = Object.values(modelsWithProviders)
    .flatMap((provider) => provider?.models || [])
    .filter((model) => model.enabled)

  if (availableModels.length === 0) {
    throw new Error('No models are available or enabled for this project.')
  }

  const activeModel = availableModels.find(
    (model) => model.id === modelId,
  ) as GenericSupportedModel

  if (!activeModel) {
    console.error(`Model with ID ${modelId} not found in available models.`)
    throw new Error(
      `The requested model '${modelId}' is not available in this project. It has likely been restricted by the project's admins. You can enable this model on the admin page here: https://uiuc.chat/${projectName}/dashboard. These models are available to use: ${Array.from(
        availableModels,
      )
        .filter(
          (model) =>
            !webLLMModels.some((webLLMModel) => webLLMModel.id === model.id),
        )
        .map((model) => model.id)
        .join(', ')}`,
    )
  }

  return { activeModel, modelsWithProviders }
}
