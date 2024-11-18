import { Message, type OpenAIChatMessage } from '@/types/chat'
import {
  OpenAIModels,
  type OpenAIModel,
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
import { decryptKeyIfNeeded } from '../crypto'
import {
  AllLLMProviders,
  AzureProvider,
  OpenAIProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { AzureModels } from '../modelProviders/azure'

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
      Object.values(OpenAIModels).some((oaiModel) => oaiModel.id === model.id)
    ) {
      // OPENAI
      provider = llmProviders[ProviderNames.OpenAI] as OpenAIProvider
      provider.apiKey = await decryptKeyIfNeeded(provider.apiKey!)
      apiType = ProviderNames.OpenAI
      url = `${OPENAI_API_HOST}/v1/chat/completions`
    } else if (
      Object.values(AzureModels).some((oaiModel) => oaiModel.id === model.id)
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
    } else {
      throw new Error(
        'Unsupported OpenAI or Azure configuration. Try a different model, or re-configure your OpenAI/Azure API keys.',
      )
    }
  }

  const body = JSON.stringify({
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 4000,
    temperature: temperature,
    stream: stream,
  })

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
    },
    method: 'POST',
    body: body,
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (res.status !== 200) {
    const result = await res.json()
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      )
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      )
    }
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
