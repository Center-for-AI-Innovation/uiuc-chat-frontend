import { createAzure } from '@ai-sdk/azure'
import { generateText, streamText } from 'ai'
import { uiMessageStreamResponseToTextWithThink } from '~/app/utils/streaming/reasoningToThink'
import { conversationToModelMessages } from '~/app/utils/conversationToModelMessages'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import type { AzureProvider } from '~/utils/modelProviders/LLMProvider'
import type { Conversation } from '~/types/chat'

export async function runAzureChat(
  conversation: Conversation,
  azureProvider: AzureProvider,
  stream: boolean,
): Promise<Response> {
  if (!azureProvider?.AzureEndpoint) {
    throw new Error('AzureEndpoint is missing for Azure provider')
  }
  if (!azureProvider?.apiKey) {
    throw new Error('Azure apiKey is missing for Azure provider')
  }

  const apiKey = await decryptKeyIfNeeded(azureProvider.apiKey)
  const baseURL = normalizeAzureBaseURL(azureProvider.AzureEndpoint)
  const apiVersion = 'v1'
  const useDeploymentBasedUrls = false

  const azure = createAzure({
    apiKey,
    baseURL,
    apiVersion,
    useDeploymentBasedUrls,
  })

  const deploymentId = conversation.model.id
  const messages = conversationToModelMessages(conversation)

  const commonParams = {
    model: azure.chat(deploymentId) as any,
    messages,
    temperature: conversation.temperature ?? 0.7,
    maxOutputTokens: 8192,
  }

  if (stream) {
    const result = streamText(commonParams as any)
    return result.toTextStreamResponse()
  }

  const result = await generateText(commonParams as any)
  return new Response(
    JSON.stringify({ choices: [{ message: { content: result.text } }] }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

export async function runAzureResponsesChat(
  conversation: Conversation,
  azureProvider: AzureProvider,
  stream: boolean,
): Promise<Response> {
  if (!azureProvider?.AzureEndpoint) {
    throw new Error('AzureEndpoint is missing for Azure provider')
  }
  if (!azureProvider?.apiKey) {
    throw new Error('Azure apiKey is missing for Azure provider')
  }

  const apiKey = await decryptKeyIfNeeded(azureProvider.apiKey)
  const baseURL = normalizeAzureBaseURL(azureProvider.AzureEndpoint)
  const apiVersion = 'v1'
  const useDeploymentBasedUrls = false

  const azure = createAzure({
    apiKey,
    baseURL,
    apiVersion,
    useDeploymentBasedUrls,
  })

  const deploymentId = conversation.model.id
  const messages = conversationToModelMessages(conversation)

  const commonParams: Record<string, unknown> = {
    model: azure.responses(deploymentId) as any,
    messages,
    maxOutputTokens: 8192,
  }
  if (supportsTemperature(conversation.model.id)) {
    commonParams.temperature = conversation.temperature ?? 0.7
  } else {
    commonParams.providerOptions = { azure: { reasoningSummary: 'auto' } }
  }

  if (stream) {
    const result = streamText(commonParams as any)
    const uiResponse = result.toUIMessageStreamResponse({
      sendReasoning: true,
      onError: (error) =>
        error instanceof Error ? error.message : JSON.stringify(error),
    })
    return uiMessageStreamResponseToTextWithThink(uiResponse)
  }

  const result = await generateText(commonParams as any)
  const formatted =
    result.reasoningText && result.reasoningText.length > 0
      ? `<think>${result.reasoningText}</think>\n${result.text}`
      : result.text

  return new Response(
    JSON.stringify({ choices: [{ message: { content: formatted } }] }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

function supportsTemperature(modelId: string): boolean {
  const id = modelId.toLowerCase()
  if (id.startsWith('gpt-5')) return false
  if (id.startsWith('o')) return false
  return true
}

function normalizeAzureBaseURL(endpoint: string): string {
  let url = endpoint.trim()
  while (url.endsWith('/')) url = url.slice(0, -1)
  if (url.toLowerCase().endsWith('/openai/v1')) {
    url = url.slice(0, -3)
  } else if (url.toLowerCase().endsWith('/v1')) {
    url = url.slice(0, -3)
  }
  if (!url.toLowerCase().endsWith('/openai')) {
    url = `${url}/openai`
  }
  return url
}
