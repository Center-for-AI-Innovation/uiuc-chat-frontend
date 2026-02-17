import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { uiMessageStreamResponseToTextWithThink } from '~/app/utils/streaming/reasoningToThink'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import type { Conversation } from '~/types/chat'
import { conversationToModelMessages } from '~/app/utils/conversationToModelMessages'

export async function runOpenAIChat(
  conversation: Conversation,
  encryptedOrPlainApiKey: string,
  stream: boolean,
): Promise<Response> {
  if (!encryptedOrPlainApiKey) {
    throw new Error('OpenAI API key is missing')
  }

  const apiKey = await decryptKeyIfNeeded(encryptedOrPlainApiKey)

  const openAIClient = createOpenAI({
    apiKey,
    baseURL: 'https://api.openai.com/v1',
  })

  const messages = conversationToModelMessages(conversation)

  const commonParams = {
    model: openAIClient.chat(conversation.model.id) as any,
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

export async function runOpenAIResponsesChat(
  conversation: Conversation,
  encryptedOrPlainApiKey: string,
  stream: boolean,
): Promise<Response> {
  if (!encryptedOrPlainApiKey) {
    throw new Error('OpenAI API key is missing')
  }

  const apiKey = await decryptKeyIfNeeded(encryptedOrPlainApiKey)

  const openAIClient = createOpenAI({
    apiKey,
    baseURL: 'https://api.openai.com/v1',
  })

  const messages = conversationToModelMessages(conversation)

  const commonParams: Record<string, unknown> = {
    model: openAIClient.responses(conversation.model.id) as any,
    messages,
    maxOutputTokens: 8192,
  }
  if (supportsTemperature(conversation.model.id)) {
    commonParams.temperature = conversation.temperature ?? 0.7
  } else {
    commonParams.providerOptions = { openai: { reasoningSummary: 'auto' } }
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
