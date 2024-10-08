import {
  ChatApiBody,
  ChatBody,
  Content,
  ContextWithMetadata,
  Conversation,
  Message,
} from '~/types/chat'
import { CourseMetadata } from '~/types/courseMetadata'
import { decrypt, decryptKeyIfNeeded } from './crypto'
import { OpenAIError } from './server'
import { NextRequest, NextResponse } from 'next/server'
import { replaceCitationLinks } from './citations'
import { fetchImageDescription } from '~/pages/api/UIUC-api/fetchImageDescription'
import { getBaseUrl } from '~/utils/apiUtils'
import posthog from 'posthog-js'
import {
  AllLLMProviders,
  AllSupportedModels,
  GenericSupportedModel,
  NCSAHostedProvider,
  OllamaProvider,
  VisionCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import fetchMQRContexts from '~/pages/api/getContextsMQR'
import fetchContexts from '~/pages/api/getContexts'
import { OllamaModelIDs } from './modelProviders/ollama'
import { webLLMModels } from './modelProviders/WebLLM'
import { OpenAIModelID } from './modelProviders/types/openai'
import { v4 as uuidv4 } from 'uuid'
import { AzureModelID } from './modelProviders/azure'
import { AnthropicModelID } from './modelProviders/types/anthropic'
import { NCSAHostedModelID } from './modelProviders/NCSAHosted'
import { NextApiRequest, NextApiResponse } from 'next'

export const maxDuration = 60

/**
 * Enum representing the possible states of the state machine used in processing text chunks.
 */
export enum State {
  Normal,
  PossibleCitationOrFilename,
  InCitation,
  InCitationPage,
  InFilename,
  InFilenameLink,
  PossibleFilename,
  AfterDigitPeriod,
  AfterDigitPeriodSpace,
}

/**
 * Processes a text chunk using a state machine to identify and replace citations or filenames with links.
 * @param {string} chunk - The text chunk to process.
 * @param {Message} lastMessage - The last message in the conversation, used for context.
 * @param {object} stateMachineContext - The current state and buffer of the state machine.
 * @param {Map<number, string>} citationLinkCache - Cache for storing and reusing citation links.
 * @returns {Promise<string>} The processed text chunk with citations and filenames replaced with links.
 */
export async function processChunkWithStateMachine(
  chunk: string,
  lastMessage: Message,
  stateMachineContext: { state: State; buffer: string },
  citationLinkCache: Map<number, string>,
): Promise<string> {
  // console.log('in processChunkWithStateMachine with chunk: ', chunk)
  let { state, buffer } = stateMachineContext
  let processedChunk = ''

  if (!chunk) {
    return ''
  }

  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i]!
    switch (state) {
      case State.Normal:
        // console.log('in state normal with char: ', char)
        if (char === '[') {
          state = State.PossibleCitationOrFilename
          // console.log('state changed to possible citation or filename')
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else if (char.match(/\d/)) {
          let j = i + 1
          // console.log(chunk[j])
          while (j < chunk.length && /\d/.test(chunk[j] as string)) {
            j++
          }
          if (j < chunk.length && chunk[j] === '.') {
            state = State.AfterDigitPeriod
            // console.log('state changed to after digit period')
            buffer += chunk.substring(i, j + 1)
            // console.log(`added chunk to buffer: ${chunk.substring(i, j + 1)}, buffer: ${buffer}`)
            i = j
          } else if (j === chunk.length) {
            // If the chunk ends with a digit, keep it in the buffer and continue to the next chunk
            // console.log('chunk ends with a digit, keeping it in the buffer and continuing to the next chunk')
            state = State.PossibleFilename
            // console.log('state changed to possible filename')
            buffer += char
            // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
          } else {
            processedChunk += char
          }
        } else {
          processedChunk += char
        }
        break

      case State.PossibleFilename:
        if (char === '.') {
          // console.log('in state possible filename with char: ', char)
          state = State.AfterDigitPeriod
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else if (char.match(/\d/)) {
          // console.log('in state possible filename with char: ', char)
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else {
          processedChunk += buffer + char
          buffer = ''
          // console.log('Clearing buffer after invalid filename')
          state = State.Normal
          // console.log('state changed to normal')
        }
        break

      case State.PossibleCitationOrFilename:
        // console.log('in state possible citation or filename with char: ', char)
        if (char.match(/\d/)) {
          state = State.InCitation
          // console.log('state changed to in citation')
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else if (char === '.') {
          state = State.InFilename
          // console.log('state changed to in filename')
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else if (char.match(/[a-zA-Z0-9-]/)) {
          state = State.InFilenameLink // Change state to InFilenameLink
          // console.log('state changed to in filename link')
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else {
          state = State.Normal
          // console.log('state changed to normal')
          processedChunk += buffer + char
          // console.log(`added buffer and char to processed chunk: ${buffer + char}, processedChunk: ${processedChunk}`)
          buffer = ''
        }
        break

      case State.InCitation:
        // console.log('in state in citation with char: ', char)
        if (char === ']') {
          state = State.Normal
          // console.log('state changed to normal')
          processedChunk += await replaceCitationLinks(
            buffer + char,
            lastMessage,
            citationLinkCache,
          )
          buffer = ''
          // console.log('Clearing buffer after citation replacement')
        } else if (char === ',' && buffer.match(/\[\d+$/)) {
          // Detecting the start of a page number after the citation index
          buffer += char
          state = State.InCitationPage // Add a new state for handling page numbers
          // console.log('state changed to in citation page')
        } else {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        }
        break

      case State.InCitationPage:
        // Handle characters after the page number prefix
        if (char === ']') {
          state = State.Normal
          // console.log('state changed to normal')
          processedChunk += await replaceCitationLinks(
            buffer + char,
            lastMessage,
            citationLinkCache,
          )
          buffer = ''
          // console.log('Clearing buffer after citation page replacement')
        } else {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        }
        break

      case State.InFilename:
        // console.log('in state in filename with char: ', char)
        if (char.match(/\s/)) {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else if (char === '[') {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
          state = State.InFilenameLink
          // console.log('state changed to in filename link')
        } else if (char.match(/\d/) && chunk[i + 1] === '.') {
          processedChunk += await replaceCitationLinks(
            buffer,
            lastMessage,
            citationLinkCache,
          )
          buffer = char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        }
        break

      case State.InFilenameLink:
        // console.log('in state in filename link with char: ', char)
        if (char === ')') {
          processedChunk += await replaceCitationLinks(
            buffer + char,
            lastMessage,
            citationLinkCache,
          )
          buffer = ''
          // console.log('Clearing buffer after filename replacement')
          if (i < chunk.length - 1 && chunk[i + 1]?.match(/\d/)) {
            state = State.InCitation
            // console.log('state changed to in citation')
          } else {
            state = State.Normal
            // console.log('state changed to normal')
          }
        } else {
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        }
        break

      case State.AfterDigitPeriod:
        // console.log('in state after digit period with char: ', char)
        if (char === ' ') {
          // console.log('char is a space')
          // Transition to a new state to handle the space after a digit and a period
          state = State.AfterDigitPeriodSpace
          buffer += char
        } else if (char === '[') {
          // console.log('char is a [, transition to in filename link')
          // It's a filename link, transition to the appropriate state
          state = State.InFilenameLink
          buffer += char
        } else {
          // console.log('char is not a space or [, transition to normal')
          // If it's neither, revert to normal text processing
          state = State.Normal
          // console.log('state changed to normal')
          processedChunk += buffer
          // console.log(`added buffer to processed chunk: ${buffer}, processedChunk: ${processedChunk}`)
          buffer = ''
          // console.log('Clearing buffer after invalid filename')
          i-- // Re-evaluate this character in the Normal state
        }
        break

      case State.AfterDigitPeriodSpace:
        if (char === '[') {
          // It's a filename link, transition to the appropriate state
          state = State.InFilenameLink
          // console.log('state changed to in filename link')
          buffer += char
          // console.log(`added char to buffer: ${char}, buffer: ${buffer}`)
        } else {
          // It's a list item, output the buffer and revert to normal
          state = State.Normal
          // console.log('state changed to normal')
          processedChunk += buffer + char
          // console.log(`added buffer and char to processed chunk: ${buffer + char}, processedChunk: ${processedChunk}`)
          buffer = ''
        }
        break
    }
  }

  stateMachineContext.state = state
  stateMachineContext.buffer = buffer

  if (state !== State.Normal && buffer.length > 0) {
    return processedChunk
  }

  if (buffer.length > 0) {
    processedChunk += await replaceCitationLinks(
      buffer,
      lastMessage,
      citationLinkCache,
    )
    buffer = ''
  }

  return processedChunk
}

/**
 * Fetches the OpenAI key to use for the request.
 * @param {string | undefined} openai_key - The OpenAI key provided in the request.
 * @param {CourseMetadata} courseMetadata - The course metadata containing the fallback OpenAI key.
 * @returns {Promise<string>} The OpenAI key to use.
 */
export async function fetchKeyToUse(
  openai_key: string | undefined,
  courseMetadata: CourseMetadata,
): Promise<string> {
  return (
    openai_key ||
    ((await decryptKeyIfNeeded(
      courseMetadata.openai_api_key as string,
    )) as string)
  )
}

/**
 * Determines the OpenAI key to use and validates it by checking available models.
 * @param {string | undefined} openai_key - The OpenAI key provided in the request.
 * @param {CourseMetadata} courseMetadata - The course metadata containing the fallback OpenAI key.
 * @param {string} modelId - The model identifier to validate against the available models.
 * @returns {Promise<{ activeModel: GenericSupportedModel, modelsWithProviders: AllLLMProviders }>} The validated OpenAI key and available models.
 */
export async function determineAndValidateModel(
  keyToUse: string,
  modelId: string,
  projectName: string,
): Promise<{
  activeModel: GenericSupportedModel
  modelsWithProviders: AllLLMProviders
}> {
  const baseUrl = getBaseUrl()
  console.log('baseUrl:', baseUrl)

  const response = await fetch(baseUrl + '/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ openAIApiKey: keyToUse, projectName }),
  })

  if (!response.ok) {
    throw new OpenAIError(
      `Failed to fetch models: ${response.statusText}`,
      'api_error',
      'key',
      response.status.toString(),
    )
  }

  const modelsWithProviders = (await response.json()) as AllLLMProviders
  const availableModels = Object.values(modelsWithProviders)
    .flatMap((provider) => provider?.models || [])
    .filter((model) => model.enabled)

  if (availableModels.length === 0) {
    throw new Error('No models are available or enabled for this project.')
  }

  const activeModel = availableModels.find(
    (model) => model.id === modelId,
  ) as GenericSupportedModel

  if (!activeModel) {
    console.error(`Model with ID ${modelId} not found in available models.`)
    throw new Error(
      `The requested model '${modelId}' is not available in this project. It has likely been restricted by the project's admins. You can enable this model on the admin page here: https://uiuc.chat/${projectName}/materials. These models are available to use: ${Array.from(
        availableModels,
      )
        .filter(
          (model) =>
            !webLLMModels.some((webLLMModel) => webLLMModel.id === model.id),
        )
        .map((model) => model.id)
        .join(', ')}`,
    )
  }

  return { activeModel, modelsWithProviders }
}

/**
 * Validates the structure of the request body against the ChatApiBody type.
 * Throws an error with a specific message when validation fails.
 * @param {ChatApiBody} body - The request body to validate.
 */
export async function validateRequestBody(body: ChatApiBody): Promise<void> {
  // Check for required fields
  const requiredFields = ['model', 'messages', 'course_name', 'api_key']
  for (const field of requiredFields) {
    if (!body.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  // Validate against a static list of all supported models. Don't include the WebLLM since they run in the browser.
  const apiSupportedModels = Array.from(AllSupportedModels).filter(
    (model) => !webLLMModels.some((webLLMModel) => webLLMModel.id === model.id),
  )
  if (!apiSupportedModels.some((model) => model.id === body.model)) {
    throw new Error(
      `Invalid model provided '${body.model}'. Is not one of our supported models: ${Array.from(
        apiSupportedModels,
      )
        .map((model) => model.id)
        .join(', ')}`,
    )
  }

  if (
    !body.messages ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    !body.messages.some((message) => message.role === 'user')
  ) {
    throw new Error(
      'Invalid or empty messages provided. Messages must contain at least one user message.',
    )
  }

  if (
    body.temperature &&
    (typeof body.temperature !== 'number' ||
      body.temperature < 0 ||
      body.temperature > 1)
  ) {
    throw new Error('Invalid temperature provided')
  }

  if (typeof body.course_name !== 'string') {
    throw new Error(
      "Invalid course_name provided. 'course_name' must be a string.",
    )
  }

  if (body.stream && typeof body.stream !== 'boolean') {
    throw new Error("Invalid stream provided. 'stream' must be a boolean.")
  }

  const hasImageContent = body.messages.some(
    (message) =>
      Array.isArray(message.content) &&
      message.content.some((content) => content.type === 'image_url'),
  )
  if (
    hasImageContent &&
    !VisionCapableModels.has(body.model as OpenAIModelID)
  ) {
    throw new Error(
      `The selected model '${body.model}' does not support vision capabilities. Use one of these: ${Array.from(VisionCapableModels).join(', ')}`,
    )
  }

  // Additional validation for other fields can be added here if needed
}

/**
 * Constructs the search query from the user messages in the conversation.
 * @param {Conversation} conversation - The conversation object containing messages.
 * @returns {string} A string representing the search query.
 */
export function constructSearchQuery(messages: Message[]): string {
  return messages
    .filter((msg) => msg.role === 'user')
    .map((msg) => {
      if (typeof msg.content === 'string') {
        return msg.content
      } else if (Array.isArray(msg.content)) {
        return msg.content
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
      }
      return ''
    })
    .join('\n')
}

export const handleContextSearch = async (
  message: Message,
  courseName: string,
  selectedConversation: Conversation,
  searchQuery: string,
  documentGroups: string[],
): Promise<ContextWithMetadata[]> => {
  if (courseName !== 'gpt4') {
    const token_limit = selectedConversation.model.tokenLimit
    const useMQRetrieval = false

    const fetchContextsFunc = useMQRetrieval ? fetchMQRContexts : fetchContexts
    const curr_contexts = await fetchContextsFunc(
      courseName,
      searchQuery,
      token_limit,
      documentGroups,
    )

    message.contexts = curr_contexts as ContextWithMetadata[]
    return curr_contexts as ContextWithMetadata[]
  }
  return []
}

/**
 * Attaches contexts to the last message in the conversation.
 * @param {Message} lastMessage - The last message object in the conversation.
 * @param {ContextWithMetadata[]} contexts - The contexts to attach.
 */
export function attachContextsToLastMessage(
  lastMessage: Message,
  contexts: ContextWithMetadata[],
): void {
  if (!lastMessage.contexts) {
    lastMessage.contexts = []
  }
  lastMessage.contexts = contexts
  console.log('lastMessage: ', lastMessage)
}

/**
 * Constructs the ChatBody object for the chat handler.
 * @param {string} model - The model identifier.
 * @param {Conversation} conversation - The conversation object.
 * @param {string} key - The API key.
 * @param {string} prompt - The prompt for the chat.
 * @param {number} temperature - The temperature setting for the chat.
 * @param {string} course_name - The course name associated with the chat.
 * @param {boolean} stream - A boolean indicating if the response should be streamed.
 * @returns {ChatBody} The constructed ChatBody object.
 */
export function constructChatBody(
  conversation: Conversation,
  key: string,
  course_name: string,
  stream: boolean,
  courseMetadata?: CourseMetadata,
  llmProviders?: AllLLMProviders,
): ChatBody {
  return {
    conversation: conversation,
    key: key,
    course_name: course_name,
    stream: stream,
    courseMetadata: courseMetadata,
    llmProviders: llmProviders,
  }
}

/**
 * Handles the streaming of the chat response.
 * @param {NextResponse} apiResponse - The response from the chat handler.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @returns {Promise<NextResponse>} A NextResponse object representing the streaming response.
 */
export async function handleStreamingResponse(
  apiResponse: Response,
  conversation: Conversation,
  req: NextApiRequest,
  res: NextApiResponse,
  course_name: string,
): Promise<void> {
  if (!apiResponse.body) {
    console.error('API response body is null')
    res.status(500).json({ error: 'API response body is null' })
    return
  }

  const lastMessage = conversation.messages[
    conversation.messages.length - 1
  ] as Message
  const stateMachineContext = { state: State.Normal, buffer: '' }
  const citationLinkCache = new Map<number, string>()
  let fullAssistantResponse = ''

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    const decoder = new TextDecoder()
    const reader = apiResponse.body.getReader()

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      let decodedChunk = decoder.decode(value, { stream: true })
      decodedChunk = await processChunkWithStateMachine(
        decodedChunk,
        lastMessage,
        stateMachineContext,
        citationLinkCache,
      )
      fullAssistantResponse += decodedChunk
      res.write(decodedChunk)
    }

    // Handle any remaining buffer
    if (stateMachineContext.buffer.length > 0) {
      const finalChunk = await processChunkWithStateMachine(
        '',
        lastMessage,
        stateMachineContext,
        citationLinkCache,
      )
      fullAssistantResponse += finalChunk
      res.write(finalChunk)
    }

    // Append the processed response to the conversation
    conversation.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: fullAssistantResponse,
    })

    // Log the conversation to the database
    await updateConversationInDatabase(conversation, course_name, req)
  } catch (error) {
    console.error('Error processing streaming response:', error)
    res.status(500).json({ error: 'Error processing streaming response' })
  } finally {
    res.end()
  }
}

/**
 * Processes the API response data.
 * @param {string} data - The response data as a string.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @returns {Promise<string>} The processed data.
 */
async function processResponseData(
  data: string,
  conversation: Conversation,
  req: NextApiRequest,
  course_name: string,
): Promise<string> {
  const lastMessage = conversation.messages[
    conversation.messages.length - 1
  ] as Message
  const stateMachineContext = { state: State.Normal, buffer: '' }
  const citationLinkCache = new Map<number, string>()

  try {
    const processedData = await processChunkWithStateMachine(
      data,
      lastMessage,
      stateMachineContext,
      citationLinkCache,
    )
    await updateConversationInDatabase(conversation, course_name, req)
    return processedData
  } catch (error) {
    console.error('Error processing response data:', error)
    throw error
  }
}

/**
 * Handles the non-streaming response from the chat handler.
 * @param {Response} apiResponse - The response from the chat handler.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextApiRequest} req - The incoming Next.js API request object.
 * @param {NextApiResponse} res - The Next.js API response object.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export async function handleNonStreamingResponse(
  apiResponse: Response,
  conversation: Conversation,
  req: NextApiRequest,
  res: NextApiResponse,
  course_name: string,
): Promise<void> {
  if (!apiResponse.body) {
    console.error('API response body is null')
    res.status(500).json({ error: 'API response body is null' })
    return
  }

  try {
    const json = await apiResponse.json()
    const response = json.choices[0].message.content || ''
    const processedResponse = await processResponseData(
      response,
      conversation,
      req,
      course_name,
    )
    const contexts =
      conversation.messages[conversation.messages.length - 1]?.contexts
    res.status(200).json({ message: processedResponse, contexts: contexts })
    return
  } catch (error) {
    console.error('Error handling non-streaming response:', error)
    res.status(500).json({ error: 'Failed to process response' })
  }
}

/**
 * Updates the conversation in the database with the full text response.
 * @param {Conversation} conversation - The conversation object.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @param {NextRequest} req - The incoming Next.js API request object.
 */
export async function updateConversationInDatabase(
  conversation: Conversation,
  course_name: string,
  req: NextApiRequest,
) {
  // Log conversation to Supabase
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/UIUC-api/logConversationToSupabase`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: course_name,
          conversation: conversation,
        }),
      },
    )
    const data = await response.json()
    console.log('Updated conversation in Supabase:', data)
    // return data.success
  } catch (error) {
    console.error('Error setting course data:', error)
    // return false
  }

  posthog.capture('stream_api_conversation_updated', {
    distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    conversation_id: conversation.id,
    user_id: conversation.userEmail,
  })
}

/**
 * Processes an image content message by fetching a description from OpenAI API.
 * It appends or updates the image description in the search query and message content.
 *
 * @param {Message} message - The message object containing image content.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @param {Conversation} updatedConversation - The updated conversation object.
 * @param {string} searchQuery - The current search query string.
 * @param {CourseMetadata} courseMetadata - Metadata associated with the course.
 * @param {string} apiKey - The API key for the AI service.
 * @param {AbortController} controller - The controller to handle aborted requests.
 * @returns {Promise<string>} The updated search query with the image description.
 */
export async function handleImageContent(
  message: Message,
  course_name: string,
  updatedConversation: Conversation,
  searchQuery: string,
  llmProviders: AllLLMProviders,
  controller: AbortController,
) {
  // TODO: bring back client-side API keys.
  // const key =
  //   courseMetadata?.openai_api_key && courseMetadata?.openai_api_key != ''
  //     ? courseMetadata.openai_api_key
  //     : apiKey
  let imgDesc = ''
  try {
    imgDesc = await fetchImageDescription(
      course_name,
      updatedConversation,
      llmProviders,
      controller,
    )

    searchQuery += ` Image description: ${imgDesc}`

    const imgDescIndex = (message.content as Content[]).findIndex(
      (content) =>
        content.type === 'text' &&
        (content.text as string).startsWith('Image description: '),
    )

    if (imgDescIndex !== -1) {
      ;(message.content as Content[])[imgDescIndex] = {
        type: 'text',
        text: `Image description: ${imgDesc}`,
      }
    } else {
      ;(message.content as Content[]).push({
        type: 'text',
        text: `Image description: ${imgDesc}`,
      })
    }
  } catch (error) {
    console.error('Error in chat.tsx running handleImageContent():', error)
    controller.abort()
  }
  console.log('Returning search query with image description: ', searchQuery)
  return { searchQuery, imgDesc }
}

export const getOpenAIKey = (
  courseMetadata: CourseMetadata,
  userApiKey: string,
) => {
  const key =
    courseMetadata?.openai_api_key && courseMetadata?.openai_api_key != ''
      ? courseMetadata.openai_api_key
      : userApiKey
  return key
}

export const routeModelRequest = async (
  chatBody: ChatBody,
  controller: AbortController,
  baseUrl?: string,
): Promise<Response> => {
  /*  Use this to call the LLM. It will call the appropriate endpoint based on the conversation.model.
      🧠 ADD NEW LLM PROVIDERS HERE 🧠
  */
  const selectedConversation = chatBody.conversation!

  // Add this check at the beginning of the function
  if (!selectedConversation.model || !selectedConversation.model.id) {
    throw new Error(
      'Conversation model is undefined or missing "id" property.',
    )
  }

  posthog.capture('LLM Invoked', {
    distinct_id: selectedConversation.userEmail
      ? selectedConversation.userEmail
      : 'anonymous',
    user_id: selectedConversation.userEmail
      ? selectedConversation.userEmail
      : 'anonymous',
    conversation_id: selectedConversation.id,
    model_id: selectedConversation.model.id,
  })

  let response: Response
  if (
    Object.values(NCSAHostedModelID).includes(
      selectedConversation.model.id as any,
    )
  ) {
    // NCSA Hosted LLMs
    const newChatBody = chatBody!.llmProviders!.NCSAHosted as NCSAHostedProvider
    newChatBody.baseUrl = process.env.OLLAMA_SERVER_URL // inject proper baseURL

    const url = baseUrl ? `${baseUrl}/api/chat/ollama` : '/api/chat/ollama'
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        conversation: selectedConversation,
        ollamaProvider: newChatBody,
        stream: chatBody.stream,
      }),
    })
  } else if (
    Object.values(OllamaModelIDs).includes(selectedConversation.model.id as any)
  ) {
    console.log(
      'IN NCSA OLLAMA ROUTER SIDE....',
      chatBody!.llmProviders!.Ollama,
    )

    // Ollama model
    const url = baseUrl ? `${baseUrl}/api/chat/ollama` : '/api/chat/ollama'
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: selectedConversation,
        ollamaProvider: chatBody!.llmProviders!.Ollama as OllamaProvider,
      }),
    })
  } else if (
    Object.values(AnthropicModelID).includes(
      selectedConversation.model.id as any,
    )
  ) {
    const url = baseUrl
      ? `${baseUrl}/api/chat/anthropic`
      : '/api/chat/anthropic'
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatBody }),
    })
  } else if (
    Object.values(OpenAIModelID).includes(
      selectedConversation.model.id as any,
    ) ||
    Object.values(AzureModelID).includes(selectedConversation.model.id as any)
  ) {
    // Call the OpenAI or Azure API
    const url = baseUrl ? `${baseUrl}/api/chat` : '/api/chat'
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(chatBody),
    })
  } else {
    throw new Error(
      `Model '${selectedConversation.model.name}' is not supported.`,
    )
  }
  return response
}