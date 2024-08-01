import { LLMProvider } from '~/types/LLMProvider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
}

const ollamaNames = new Map([['llama3.1:70b', 'Llama 3.1 70b']])

export const getOllamaModels = async (
  ollamaProvider: LLMProvider,
): Promise<LLMProvider> => {
  try {
    if (!ollamaProvider.baseUrl) {
      ollamaProvider.error = `Ollama baseurl not defined: ${ollamaProvider.baseUrl}`
      return ollamaProvider
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ollamaProvider.error = `HTTP error! status: ${response.status}`
      return ollamaProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      // @ts-ignore - todo fix implicit any type
      .filter((model) => model.name.includes('llama3.1:70b'))
      .map((model: any): OllamaModel => {
        const newName = ollamaNames.get(model.name)
        return {
          id: model.name,
          name: newName ? newName : model.name,
          parameterSize: model.details.parameter_size,
          tokenLimit: 4096,
          enabled: true,
        }
      })
    ollamaProvider.models = ollamaModels
    return ollamaProvider
  } catch (error: any) {
    ollamaProvider.error = error.message
    return ollamaProvider
  }
}

// export const getOllamaModels = async (
//   ollamaProvider: LLMProvider,
// ): Promise<LLMProvider> => {

//   const response = await fetch(`/api/chat/ollama?ollamaProvider=${encodeURIComponent(JSON.stringify(ollamaProvider))}`)
//   if (!response.ok) {
//     ollamaProvider.error = `HTTP error! status: ${response.status}, message: ${response.statusText}`
//     return ollamaProvider
//   }
//   return await response.json()
// }
