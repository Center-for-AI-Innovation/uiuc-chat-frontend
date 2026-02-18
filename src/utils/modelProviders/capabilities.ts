import { type AllLLMProviders, type AnySupportedModel } from './LLMProvider'
import { OpenAIModelID } from './types/openai'
import { AzureModelID } from './azureModels'
import { AnthropicModelID } from './types/anthropic'
import { GeminiModelID } from './types/gemini'
import { BedrockModelID } from './types/bedrock'
import { SambaNovaModelID } from './types/SambaNova'
import { functionCallingModelIds } from './ConfigWebLLM'
import { NCSAHostedVLMModelID } from './types/NCSAHostedVLM'

export function modelSupportsTools(
  model: AnySupportedModel | null | undefined,
  _llmProviders?: AllLLMProviders,
): boolean {
  if (!model) return false

  // Check well-known providers whose models support tool/function calling via AI SDKs
  if (
    Object.values(OpenAIModelID).includes(model.id as any) ||
    Object.values(AzureModelID).includes(model.id as any) ||
    Object.values(AnthropicModelID).includes(model.id as any) ||
    Object.values(GeminiModelID).includes(model.id as any) ||
    Object.values(BedrockModelID).includes(model.id as any) ||
    Object.values(SambaNovaModelID).includes(model.id as any) ||
    Object.values(NCSAHostedVLMModelID).includes(model.id as any)
  ) {
    return true
  }

  // WebLLM: only specific models in functionCallingModelIds
  if (functionCallingModelIds.includes((model as any).name)) {
    return true
  }

  return false
}
