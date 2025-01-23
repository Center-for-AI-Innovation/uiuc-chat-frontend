// import { OllamaProvider } from 'ollama-ai-provider'
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
  let wasDefault = false
  if (ncsaHostedProvider.models) {
    // WARNING! This assumes that the only model you're touching is the first one. We should change this later as needed.
    wasDefault = ncsaHostedProvider.models[0]?.default ? true : false
  }
  // FOR THE FUTURE-- if there are multiple NCSA Hosted models, we can use a map instead
  // const existingDefaults = new Map<string, boolean>()
  // if (ncsaHostedProvider.models) {
  //   ncsaHostedProvider.models.forEach(model => {
  //     existingDefaults.set(model.id, !!model.default)
  //   })
  // }
  try {
    // /api/tags - all downloaded models - might not have room on the GPUs.
    // /api/ps - all HOT AND LOADED models
    const response = await fetch(process.env.OLLAMA_SERVER_URL + '/api/ps')

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      ncsaHostedProvider.models = [] // clear any previous models.
      return ncsaHostedProvider as NCSAHostedProvider
    }

    // ✅ HARD CODE ONLY ONE MODEL
    // const ollamaModels = [NCSAHostedModels['llama3.1:8b-instruct-fp16']]
    const ollamaModels = [
      OllamaModels[OllamaModelIDs.LLAMA31_8b_instruct_fp16],
      OllamaModels[OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_14b_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_7b_fp16],
      // OllamaModels[OllamaModelIDs.LLAMA32_3b_fp16],
    ]

    // ❌ DYNAMICALLY show all HOT AND LOADED models
    // const ollamaModels: OllamaModel[] = data.models
    // .filter((model: any) =>
    //   Object.values(NCSAHostedModelID).includes(model.model),
    // )
    // .map((model: any): OllamaModel => {
    //   const knownModel = NCSAHostedModels[model.model as NCSAHostedModelID]
    //   return {
    //     ...knownModel,
    //     default: existingDefaults.get(knownModel.id) || false,
    //   }
    // })

    ncsaHostedProvider.models = ollamaModels
    if (ncsaHostedProvider.models[0]) {
      ncsaHostedProvider.models[0].default = wasDefault
    }
    return ncsaHostedProvider as NCSAHostedProvider
  } catch (error: any) {
    ncsaHostedProvider.error = error.message
    console.warn('ERROR in getNCSAHostedModels', error)
    ncsaHostedProvider.models = [] // clear any previous models.
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
