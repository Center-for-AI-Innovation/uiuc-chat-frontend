import { type OpenAIChatMessage } from '@/types/chat'
import {
  GPT5Models,
  ModelIDsThatUseDeveloperMessage,
  type OpenAIModel,
  type OpenAIModelID,
} from '~/utils/modelProviders/types/openai'

import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '../app/const'

import {
  type ParsedEvent,
  type ReconnectInterval,
  createParser,
} from 'eventsource-parser'
import {
  type AllLLMProviders,
  type AzureProvider,
  type NCSAHostedVLMProvider,
  type OpenAIProvider,
  ProviderNames,
  ReasoningCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { decryptKeyIfNeeded } from '../crypto'

export class OpenAIError extends Error {
  constructor(
    message: string,
    public type?: string,
    public param?: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  llmProviders: AllLLMProviders,
  messages: OpenAIChatMessage[],
  stream: boolean,
) => {
  // default to OpenAI not Azure
  let apiType
  let url

  // TODO: What if user brings their own OpenAI compatible models??

  let provider
  if (llmProviders) {
    if (
      llmProviders.OpenAI.enabled &&
      (llmProviders.OpenAI.models || [])
        .filter((m) => m.enabled)
        .some((oaiModel) => oaiModel.id === model.id)
    ) {
      // OPENAI
      provider = llmProviders[ProviderNames.OpenAI] as OpenAIProvider
      provider.apiKey = await decryptKeyIfNeeded(provider.apiKey!)
      apiType = ProviderNames.OpenAI
      url = `${OPENAI_API_HOST}/v1/chat/completions`
    } else if (
      llmProviders.Azure.enabled &&
      (llmProviders.Azure.models || [])
        .filter((m) => m.enabled)
        .some((oaiModel) => oaiModel.id === model.id)
    ) {
      // AZURE
      apiType = ProviderNames.Azure
      provider = llmProviders[ProviderNames.Azure] as AzureProvider
      provider.apiKey = await decryptKeyIfNeeded(provider.apiKey!)

      provider.models?.forEach((m) => {
        // find the model who's model.id matches model.id
        if (m.id === model.id) {
          url = `${provider!.AzureEndpoint}/openai/deployments/${m.azureDeploymentID}/chat/completions?api-version=${OPENAI_API_VERSION}`
        }
      })
    } else if (
      llmProviders.NCSAHostedVLM.enabled &&
      (llmProviders.NCSAHostedVLM.models || [])
        .filter((m) => m.enabled)
        .some((oaiModel) => oaiModel.id === model.id)
    ) {
      // NCSA Hosted VLM
      provider = llmProviders[
        ProviderNames.NCSAHostedVLM
        ] as NCSAHostedVLMProvider
      // provider.apiKey = await decryptKeyIfNeeded(provider.apiKey!)
      provider.apiKey = process.env.NCSA_HOSTED_API_KEY || ''
      apiType = ProviderNames.NCSAHostedVLM
      url = `${process.env.NCSA_HOSTED_VLM_BASE_URL}/chat/completions`
    } else {
      throw new Error(
        'Unsupported OpenAI or Azure configuration. Try a different model, or re-configure your OpenAI/Azure API keys.',
      )
    }
  }

  const isOModel = ModelIDsThatUseDeveloperMessage.includes(
    model.id as OpenAIModelID,
  )
  const isGPT5Model = GPT5Models.includes(model.id as OpenAIModelID)

  const isReasoningCapableModel = ReasoningCapableModels.has(
    model.id as OpenAIModelID,
  )

  // strip 'thinking' from the model id if it exists
  const modelId = isReasoningCapableModel
    ? model.id.replace('-thinking', '')
    : model.id

  const jsonBody = {
    ...(OPENAI_API_TYPE === 'openai' && { model: modelId }),
    messages: [
      {
        role: isOModel ? 'developer' : 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    ...(isOModel || isGPT5Model ? {} : { temperature: temperature }),
    stream: stream,
    ...(isReasoningCapableModel ? { reasoning_effort: 'medium' } : {}),
  }

  const body = JSON.stringify(jsonBody)

  if (!url) {
    throw new Error('URL is undefined')
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(apiType === ProviderNames.OpenAI && {
        Authorization: `Bearer ${provider!.apiKey}`,
      }),
      ...(apiType === ProviderNames.Azure && {
        'api-key': `${provider!.apiKey}`,
      }),
      ...(apiType === ProviderNames.OpenAI &&
        OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION,
        }),
      ...(apiType === ProviderNames.NCSAHostedVLM && {
        Authorization: `Bearer ${provider!.apiKey}`,
      }),
    },
    method: 'POST',
    body: body,
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (!res.ok) {
    const raw = await res.text() // always consume body as text once
    let parsed: any = null

    try {
      parsed = JSON.parse(raw)
    } catch {
      // not JSON, ignore
    }

    if (parsed?.error) {
      throw new OpenAIError(
        parsed.error.message,
        parsed.error.type,
        parsed.error.param,
        parsed.error.code,
      )
    }

    throw new Error(
      `OpenAI API returned an error (${res.status}): ${parsed?.message || raw || res.statusText}`,
    )
  }

  if (stream) {
    let isStreamClosed = false // Flag to track the state of the stream
    const apiStream = new ReadableStream({
      async start(controller) {
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data

            try {
              // console.log('data: ', data) // ! DEBUGGING
              if (data.trim() !== '[DONE]') {
                const json = JSON.parse(data)
                if (json.choices[0].finish_reason != null) {
                  if (!isStreamClosed) {
                    controller.close()
                    isStreamClosed = true // Update the flag after closing the stream
                  }
                  return
                }
                const text = json.choices[0].delta.content
                const queue = encoder.encode(text)
                controller.enqueue(queue)
              } else {
                if (!isStreamClosed) {
                  controller.close()
                  isStreamClosed = true // Update the flag after closing the stream
                }
                return
              }
            } catch (e) {
              if (!isStreamClosed) {
                controller.error(e)
                isStreamClosed = true // Update the flag if an error occurs
              }
            }
          }
        }

        const parser = createParser(onParse)

        try {
          for await (const chunk of res.body as any) {
            if (!isStreamClosed) {
              // Only feed the parser if the stream is not closed
              parser.feed(decoder.decode(chunk))
            }
          }
        } catch (e) {
          if (!isStreamClosed) {
            controller.error(e)
            isStreamClosed = true
          }
        }
      },
    })
    return apiStream
  } else {
    console.log('Non Streaming response from OpenAI')
    const json = await res.json()
    return json
  }
}
