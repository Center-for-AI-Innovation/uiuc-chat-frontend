import {
  AzureProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '../crypto'
import { OPENAI_API_VERSION } from '../app/const'

export const config = {
  runtime: 'edge',
}

// OMG azure sucks
// the azureDeploymentID is require to make requests. Grab it from the /deployments list in getAzureModels()
// The azureDeploymentModelName is the Azure-standardized model names, similar to OpenAI model IDs.

export interface AzureModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  azureDeploymentModelName: string
  azureDeploymentID?: string // Each deployment has a `model` and  `id`. The deployment ID is needed for making chat requests.
}

export enum AzureModelID {
  GPT_4o_mini = 'gpt-4o-mini-2024-07-18',
  GPT_4o = 'gpt-4o-2024-08-06',
  GPT_4 = 'gpt-4-0613',
  GPT_4_Turbo = 'gpt-4-turbo-2024-04-09',
  GPT_3_5 = 'gpt-35-turbo-0125',
}

export enum AzureDeploymentModelName {
  GPT_4o_mini = 'gpt-4o-mini',
  GPT_4o = 'gpt-4o',
  GPT_4 = 'gpt-4',
  GPT_4_Turbo = 'gpt-4-turbo',
  GPT_3_5 = 'gpt-35-turbo',
}

export const AzureModels: Record<AzureModelID, AzureModel> = {
  [AzureModelID.GPT_3_5]: {
    id: AzureModelID.GPT_3_5,
    name: 'GPT-3.5',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_3_5,
    tokenLimit: 16385,
    enabled: true,
  },
  [AzureModelID.GPT_4]: {
    id: AzureModelID.GPT_4,
    name: 'GPT-4',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4,
    tokenLimit: 8192,
    enabled: true,
  },
  [AzureModelID.GPT_4_Turbo]: {
    id: AzureModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4_Turbo,
    tokenLimit: 128000,
    enabled: true,
  },
  [AzureModelID.GPT_4o]: {
    id: AzureModelID.GPT_4o,
    name: 'GPT-4o',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4o,
    tokenLimit: 128000,
    enabled: true,
  },
  [AzureModelID.GPT_4o_mini]: {
    id: AzureModelID.GPT_4o_mini,
    name: 'GPT-4o mini',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4o_mini,
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getAzureModels = async (
  azureProvider: AzureProvider,
): Promise<AzureProvider> => {
  delete azureProvider.error // Clear previous errors if any.
  azureProvider.provider = ProviderNames.Azure
  try {
    if (!azureProvider.AzureEndpoint || !azureProvider.apiKey) {
      // azureProvider.error = `Azure OpenAI Endpoint or Deployment is not set. Endpoint: ${azureProvider.AzureEndpoint}, Deployment: ${azureProvider.AzureDeployment}`
      azureProvider.models = [] // clear any previous models.
      return azureProvider
    }

    const baseUrl = azureProvider.AzureEndpoint.endsWith('/')
      ? azureProvider.AzureEndpoint.slice(0, -1)
      : azureProvider.AzureEndpoint
    const url = `${baseUrl}/openai/deployments?api-version=${OPENAI_API_VERSION}`

    console.log(
      'Azure api key: await decryptKeyIfNeeded(azureProvider.apiKey!)',
    )

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
          })
        }
        return acc
      },
      [],
    )

    azureProvider.models = azureModels
    return azureProvider
  } catch (error: any) {
    azureProvider.error = error.message
    console.warn('Error fetching Azure models:', error)
    azureProvider.models = [] // clear any previous models.
    return azureProvider
  }
}
