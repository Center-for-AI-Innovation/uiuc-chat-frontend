import {
  type NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModels, OllamaModelIDs } from './ollama'

export const getNCSAHostedModels = async (
  ncsaHostedProvider: NCSAHostedProvider,
): Promise<NCSAHostedProvider> => {
  delete ncsaHostedProvider.error // Remove the error property if it exists
  ncsaHostedProvider.provider = ProviderNames.NCSAHosted

  if (!ncsaHostedProvider.enabled) {
    ncsaHostedProvider.models = []
    return ncsaHostedProvider
  }

  // Store existing model states
  const existingModelStates = new Map<
    string,
    { enabled: boolean; default: boolean }
  >()
  if (ncsaHostedProvider.models) {
    ncsaHostedProvider.models.forEach((model) => {
      existingModelStates.set(model.id, {
        enabled: model.enabled ?? true,
        default: model.default ?? false,
      })
    })
  }

  try {
    // /api/tags - all downloaded models - might not have room on the GPUs.
    // /api/ps - all HOT AND LOADED models
    const response = await fetch(process.env.OLLAMA_SERVER_URL + '/api/ps')

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ncsaHostedProvider.models = [] // clear any previous models.
      return ncsaHostedProvider as NCSAHostedProvider
    }

    const ollamaModels = [
      OllamaModels[OllamaModelIDs.GEMMA3_27B],
      OllamaModels[OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_14b_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_7b_fp16],
      OllamaModels[OllamaModelIDs.LLAMA31_8b_instruct_fp16],
    ].map((model) => {
      const existingState = existingModelStates.get(model.id)
      return {
        ...model,
        enabled: existingState?.enabled ?? true,
        default: existingState?.default ?? false,
      }
    })

    ncsaHostedProvider.models = ollamaModels
    return ncsaHostedProvider as NCSAHostedProvider
  } catch (error: any) {
    ncsaHostedProvider.error = error.message
    console.warn('ERROR in getNCSAHostedModels', error)
    ncsaHostedProvider.models = [] // clear any previous models.
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
