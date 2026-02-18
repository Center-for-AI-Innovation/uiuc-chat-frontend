import {
  type AzureProvider,
  preferredModelIds,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { OPENAI_API_VERSION } from '../app/const'
import { decryptKeyIfNeeded } from '../crypto'
import { type AzureModel, AzureModelID, AzureModels } from './azureModels'

// OMG azure sucks
// the azureDeploymentID is require to make requests. Grab it from the /deployments list in getAzureModels()
// The azureDeploymentModelName is the Azure-standardized model names, similar to OpenAI model IDs.

export { AzureModelID, AzureModels } from './azureModels'
export type { AzureModel } from './azureModels'

export const getAzureModels = async (
  azureProvider: AzureProvider,
): Promise<AzureProvider> => {
  delete azureProvider.error // Clear previous errors if any.
  azureProvider.provider = ProviderNames.Azure
  try {
    if (
      !azureProvider.AzureEndpoint ||
      !azureProvider.apiKey ||
      !azureProvider.enabled
    ) {
      // azureProvider.error = `Azure OpenAI Endpoint or Deployment is not set. Endpoint: ${azureProvider.AzureEndpoint}, Deployment: ${azureProvider.AzureDeployment}`
      azureProvider.models = [] // clear any previous models.
      return azureProvider
    }

    const baseUrl = azureProvider.AzureEndpoint.endsWith('/')
      ? azureProvider.AzureEndpoint.slice(0, -1)
      : azureProvider.AzureEndpoint
    const url = `${baseUrl}/openai/deployments?api-version=${OPENAI_API_VERSION}`

    // console.log('Fetching Azure models from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': await decryptKeyIfNeeded(azureProvider.apiKey!),
      },
    })

    if (!response.ok) {
      azureProvider.error = `Error ${response.status}. Azure OpenAI failed to fetch models. ${response.statusText}`
      azureProvider.models = [] // clear any previous models.
      return azureProvider
    }

    const responseJson = await response.json()

    // gpt-5-thinking may not be explicitly listed in the response; Azure often only returns "gpt-5".
    // If we see a gpt-5 deployment, synthesize a gpt-5-thinking entry that points at the same deployment id.
    const gpt5Deployment = responseJson.data.find(
      (model: any) => model?.model === 'gpt-5',
    )
    const hasThinkingAlready = responseJson.data.some(
      (model: any) => model?.model === 'gpt-5-thinking',
    )
    if (gpt5Deployment && !hasThinkingAlready) {
      responseJson.data.push({
        ...gpt5Deployment,
        model: 'gpt-5-thinking',
      })
    }

    const azureModels: AzureModel[] = responseJson.data.reduce(
      (acc: AzureModel[], model: any) => {
        const predefinedModel = Object.values(AzureModels).find(
          (azureModel) =>
            azureModel.azureDeploymentModelName.toLowerCase() ===
            model.model.toLowerCase(),
        )
        if (predefinedModel) {
          acc.push({
            id: predefinedModel.id,
            name: predefinedModel.name,
            tokenLimit: predefinedModel.tokenLimit,
            azureDeploymentModelName: predefinedModel.azureDeploymentModelName,
            azureDeploymentID: model.id,
            enabled:
              azureProvider.models?.find((m) => m.id === predefinedModel.id)
                ?.enabled ?? predefinedModel.enabled,
            default:
              azureProvider.models?.find((m) => m.id === predefinedModel.id)
                ?.default ?? predefinedModel.default,
            temperature:
              azureProvider.models?.find((m) => m.id === predefinedModel.id)
                ?.temperature ?? predefinedModel.temperature,
          })
        }
        return acc
      },
      [],
    )

    // Sort the azureModels based on the preferredModelIds
    azureModels.sort((a, b) => {
      const indexA = preferredModelIds.indexOf(a.id as AzureModelID)
      const indexB = preferredModelIds.indexOf(b.id as AzureModelID)
      return (
        (indexA === -1 ? Infinity : indexA) -
        (indexB === -1 ? Infinity : indexB)
      )
    })

    azureProvider.models = azureModels
    return azureProvider
  } catch (error: any) {
    azureProvider.error = error.message
    console.warn('Error fetching Azure models:', error)
    azureProvider.models = [] // clear any previous models.
    return azureProvider
  }
}
