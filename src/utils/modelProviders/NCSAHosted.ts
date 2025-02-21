import {
  type NCSAHostedProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { OllamaModels, OllamaModelIDs } from './ollama'
import { ChatBody } from '~/types/chat'

export const getNCSAHostedModels = async (
  ncsaHostedProvider: NCSAHostedProvider,
): Promise<NCSAHostedProvider> => {
  delete ncsaHostedProvider.error // Remove the error property if it exists
  ncsaHostedProvider.provider = ProviderNames.NCSAHosted

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
      OllamaModels[OllamaModelIDs.LLAMA31_8b_instruct_fp16],
      OllamaModels[OllamaModelIDs.DEEPSEEK_R1_14b_qwen_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_14b_fp16],
      OllamaModels[OllamaModelIDs.QWEN25_7b_fp16],
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

export const ncsaHostedChat = async (
  chatBody: ChatBody,
  stream = true
): Promise<any> => {
  const { conversation } = chatBody
  
  console.log('NCSA Chat Request:', {
    model: conversation?.model,
    messageCount: conversation?.messages?.length,
    stream: stream
  })

  const response = await fetch(`${process.env.OLLAMA_SERVER_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: conversation?.model,
      messages: conversation?.messages,
      stream: stream,   
      temperature: conversation?.temperature
    })
  })

  if (!response.ok) {
    console.error('NCSA API Error Response:', {
      status: response.status,
      statusText: response.statusText
    })
    throw new Error(`NCSA API error: ${response.status} ${response.statusText}`)
  }

  if (stream) {
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } else {
    // For non-streaming responses, ensure we get the full response
    const data = await response.json()
    console.log('NCSA API Response Data:', data)
    
    // Check if the response has the expected structure
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      console.error('Empty or invalid NCSA API response:', data)
      throw new Error('Empty or invalid response from NCSA API')
    }

    // Log the final response being sent back
    const finalResponse = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('Final Response:', await finalResponse.clone().json())
    return finalResponse
  }
}
