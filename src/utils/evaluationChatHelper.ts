/**
 * Internal chat helper for evaluation
 * Reuses chat-api logic but uses authentication instead of API keys
 */

import { v4 as uuidv4 } from 'uuid'
import { type Conversation, type Message } from '~/types/chat'
import { type CourseMetadata } from '~/types/courseMetadata'
import { type AllLLMProviders, type GenericSupportedModel } from '~/utils/modelProviders/LLMProvider'
import { determineAndValidateModelServer } from '~/pages/api/chat-api/util/determineAndValidateModelServer'
import fetchCourseMetadataServer from '~/pages/api/chat-api/util/fetchCourseMetadataServer'
import {
  handleContextSearch,
  constructSearchQuery,
  routeModelRequest,
  attachContextsToLastMessage,
} from '~/utils/streamProcessing'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type ChatBody } from '~/types/chat'
import { type AuthenticatedUser } from '~/middleware'

export interface GetChatResponseParams {
  question: string
  course_name: string
  model: string
  temperature: number
  doc_groups: string[]
  user: AuthenticatedUser
}

/**
 * Gets a chat response for evaluation purposes
 * Reuses chat-api logic but uses authentication instead of API keys
 */
export async function getChatResponse({
  question,
  course_name,
  model,
  temperature,
  doc_groups,
  user,
}: GetChatResponseParams): Promise<string> {
  // Fetch course metadata
  const courseMetadata: CourseMetadata | null =
    await fetchCourseMetadataServer(course_name)
  if (!courseMetadata) {
    throw new Error('Course metadata not found')
  }

  // Determine and validate the model to use
  const { activeModel, modelsWithProviders } =
    await determineAndValidateModelServer(model, course_name)

  // Construct messages
  const messages: Message[] = [
    {
      id: uuidv4(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    },
  ]

  // Construct search query
  const searchQuery = constructSearchQuery(messages)
  const lastMessage = messages[messages.length - 1]!

  // Use provided temperature or default
  const chatFinalTemperature = temperature !== undefined ? temperature : 0.1

  // Construct conversation object
  const conversation: Conversation = {
    id: uuidv4(),
    name: 'Evaluation Conversation',
    messages: messages,
    model: activeModel,
    prompt: DEFAULT_SYSTEM_PROMPT,
    temperature: chatFinalTemperature,
    folderId: null,
    userEmail: user.email,
  }

  // Fetch contexts
  const contexts = await handleContextSearch(
    lastMessage,
    course_name,
    conversation,
    searchQuery,
    doc_groups,
  )

  // Attach contexts to the last message
  if (contexts.length > 0) {
    attachContextsToLastMessage(lastMessage, contexts)
  }

  // Build the prompt
  const chatBody: ChatBody = {
    conversation,
    key: modelsWithProviders.OpenAI?.apiKey || '',
    course_name,
    stream: false,
    courseMetadata,
    llmProviders: modelsWithProviders,
    mode: 'chat',
  }

  const buildPromptResponse = await buildPrompt({
    conversation: chatBody.conversation!,
    projectName: chatBody.course_name,
    courseMetadata: chatBody.courseMetadata,
  })

  chatBody.conversation = buildPromptResponse

  // Make the API request to the chat handler (non-streaming)
  const controller = new AbortController()
  const apiResponse = await routeModelRequest(chatBody, controller)

  // Handle errors
  if (!apiResponse.ok) {
    const errorText = await apiResponse.text()
    throw new Error(`Chat API error: ${apiResponse.statusText} - ${errorText}`)
  }

  // Parse non-streaming response
  const json = await apiResponse.json()
  const answer = json.choices?.[0]?.message?.content || ''

  if (!answer) {
    throw new Error('No answer received from chat API')
  }

  return answer
}

