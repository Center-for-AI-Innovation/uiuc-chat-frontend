import {
  type ChatApiBody,
  type ChatBody,
  type Content,
  type ContextWithMetadata,
  type Conversation,
  type Message,
} from '~/types/chat'
import { type CourseMetadata } from '~/types/courseMetadata'
import { OpenAIError } from './server'
import { replaceCitationLinks } from './citations'
import { fetchImageDescription } from '~/pages/api/UIUC-api/fetchImageDescription'
import { getBaseUrl } from '~/utils/apiUtils'
import posthog from 'posthog-js'
import {
  type AllLLMProviders,
  AllSupportedModels,
  type AnthropicProvider,
  type GenericSupportedModel,
  type NCSAHostedVLMProvider,
  type OllamaProvider,
  VisionCapableModels,
  type BedrockProvider,
  type GeminiProvider,
  type SambaNovaProvider,
} from '~/utils/modelProviders/LLMProvider'
import fetchMQRContexts from '~/pages/api/getContextsMQR'
import fetchContexts from '~/pages/api/getContexts'
import { OllamaModelIDs } from './modelProviders/ollama'
import { webLLMModels } from './modelProviders/WebLLM'
import { OpenAIModelID } from './modelProviders/types/openai'
import { v4 as uuidv4 } from 'uuid'
import { AzureModelID } from './modelProviders/azure'
import { AnthropicModelID } from './modelProviders/types/anthropic'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { BedrockModelID } from './modelProviders/types/bedrock'
import { GeminiModelID } from './modelProviders/types/gemini'
import { SambaNovaModelID } from './modelProviders/types/SambaNova'
import { runOllamaChat } from '~/app/utils/ollama'
import { openAIAzureChat } from './modelProviders/OpenAIAzureChat'
import { runAnthropicChat } from '~/app/utils/anthropic'
import { NCSAHostedVLMModelID } from './modelProviders/types/NCSAHostedVLM'
import { runVLLM } from '~/app/utils/vllm'
import { type CoreMessage } from 'ai'
import { runGeminiChat } from '~/app/api/chat/gemini/route'
import { runBedrockChat } from '~/app/api/chat/bedrock/route'
import { runSambaNovaChat } from '~/app/api/chat/sambanova/route'


/**
 * Enum representing the possible states of the state machine used in processing text chunks.
 */
export enum State {
  Normal,
  InCiteTag,
  InCiteContent,
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
  courseName: string,
): Promise<string> {
  let { state, buffer } = stateMachineContext
  let processedChunk = ''

  if (!chunk) {
    return ''
  }

  // Combine any leftover buffer with the new chunk
  const combinedChunk = buffer + chunk
  buffer = ''

  for (let i = 0; i < combinedChunk.length; i++) {
    const char = combinedChunk[i]!
    const remainingChars = combinedChunk.length - i

    switch (state) {
      case State.Normal:
        if (char === '<') {
          // Check if it's the start of a citation tag
          if (remainingChars >= 5) {
            const nextChars = combinedChunk.slice(i, i + 5)
            if (nextChars === '<cite') {
              state = State.InCiteTag
              buffer = '<cite'
              i += 4 // Skip the rest of 'cite'
              continue
            } else {
              // Not a citation tag, output the character
              processedChunk += char
            }
          } else {
            // Not enough chars to check - keep in buffer and wait for next chunk
            buffer = combinedChunk.slice(i)
            i = combinedChunk.length // Exit the loop
            continue
          }
        } else if (char.match(/\d/)) {
          let j = i + 1
          while (
            j < combinedChunk.length &&
            /\d/.test(combinedChunk[j] as string)
          ) {
            j++
          }
          if (j < combinedChunk.length && combinedChunk[j] === '.') {
            state = State.AfterDigitPeriod
            buffer = combinedChunk.substring(i, j + 1)
            i = j
          } else if (j === combinedChunk.length) {
            state = State.PossibleFilename
            buffer = combinedChunk.substring(i)
            i = j - 1
          } else {
            processedChunk += char
          }
        } else {
          processedChunk += char
        }
        break

      case State.InCiteTag:
        if (char === '>') {
          state = State.InCiteContent
          buffer += char
        } else {
          buffer += char
        }
        break

      case State.InCiteContent:
        if (char === '<') {
          // Check for </cite> tag
          if (remainingChars >= 7) {
            const nextChars = combinedChunk.slice(i, i + 7)
            if (nextChars === '</cite>') {
              buffer += '</cite>'
              i += 6 // Skip all 7 characters (loop will increment i by 1)
              state = State.Normal
              // Process the citation without adding extra spaces
              const processedCitation = await replaceCitationLinks(
                buffer,
                lastMessage,
                citationLinkCache,
                courseName,
              )
              processedChunk += processedCitation
              buffer = ''
              continue
            } else {
              // Not a closing cite tag, just add the '<' to buffer
              buffer += char
            }
          } else {
            // Not enough chars to check - keep everything in buffer
            buffer += combinedChunk.slice(i)
            i = combinedChunk.length // Exit the loop
            continue
          }
        } else {
          buffer += char
        }
        break

      case State.PossibleFilename:
        if (char === '.') {
          state = State.AfterDigitPeriod
          buffer += char
        } else if (char.match(/\d/)) {
          buffer += char
        } else {
          processedChunk += buffer + char
          buffer = ''
          state = State.Normal
        }
        break

      case State.AfterDigitPeriod:
        if (char === ' ') {
          state = State.AfterDigitPeriodSpace
          buffer += char
        } else if (char === '[') {
          state = State.InFilenameLink
          buffer += char
        } else {
          state = State.Normal
          processedChunk += buffer
          buffer = ''
          i--
        }
        break

      case State.AfterDigitPeriodSpace:
        if (char === '[') {
          state = State.InFilenameLink
          buffer += char
        } else {
          state = State.Normal
          processedChunk += buffer + char
          buffer = ''
        }
        break

      case State.InFilenameLink:
        if (char === ')') {
          processedChunk += await replaceCitationLinks(
            buffer + char,
            lastMessage,
            citationLinkCache,
            courseName,
          )
          buffer = ''
          if (
            i < combinedChunk.length - 1 &&
            combinedChunk[i + 1]?.match(/\d/)
          ) {
            state = State.InCiteContent
          } else {
            state = State.Normal
          }
        } else {
          buffer += char
        }
        break
    }
  }

  // Update the state machine context
  stateMachineContext.state = state
  stateMachineContext.buffer = buffer

  // Only output buffer content if we're in Normal state and not potentially mid-tag
  if (buffer.length > 0 && state === State.Normal && !buffer.startsWith('<')) {
    processedChunk += buffer
    buffer = ''
  }

  return processedChunk
}

/**
 * Determines the OpenAI key to use and validates it by checking available models.
 * @param {string | undefined} openai_key - The OpenAI key provided in the request.
 * @param {CourseMetadata} courseMetadata - The course metadata containing the fallback OpenAI key.
 * @param {string} modelId - The model identifier to validate against the available models.
 * @returns {Promise<{ activeModel: GenericSupportedModel, modelsWithProviders: AllLLMProviders }>} The validated OpenAI key and available models.
 */
export async function determineAndValidateModel(
  modelId: string,
  projectName: string,
): Promise<{
  activeModel: GenericSupportedModel
  modelsWithProviders: AllLLMProviders
}> {
  const baseUrl = getBaseUrl()

  const response = await fetch(baseUrl + '/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectName }),
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
      `The requested model '${modelId}' is not available in this project. It has likely been restricted by the project's admins. You can enable this model on the admin page here: https://uiuc.chat/${projectName}/dashboard. These models are available to use: ${Array.from(
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
        course_name,
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
        course_name,
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
      course_name,
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
    const baseUrl = await getBaseUrl()
    const response = await fetch(
      `${baseUrl}/api/UIUC-api/logConversationToSupabase`,
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
    // const data = await response.json()
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
      ; (message.content as Content[])[imgDescIndex] = {
        type: 'text',
        text: `Image description: ${imgDesc}`,
      }
    } else {
      ; (message.content as Content[]).push({
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

// Helper function to convert conversation to Vercel AI SDK v3 format
function convertMessagesToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      content = message.finalPromtEngineeredMessage || ''
    } else if (Array.isArray(message.content)) {
      content = message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
    } else {
      content = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: content,
    })
  })

  return coreMessages
}

export const routeModelRequest = async (
  chatBody: ChatBody,
  controller?: AbortController,
  baseUrl?: string,
): Promise<any> => {
  console.log(
    'In routeModelRequest: ',
    `Conversation name: ${chatBody.conversation?.name}, Conversation prompt: ${chatBody.conversation?.prompt}, System prompt: ${chatBody.courseMetadata?.system_prompt}`,
  )
  /*  Use this to call the LLM. It will call the appropriate endpoint based on the conversation.model.
  🧠 ADD NEW LLM PROVIDERS HERE 🧠
  NOTE: WebLLM is handled separately, because it MUST be called from the Client browser itself. 
  */

  const selectedConversation = chatBody.conversation!
  console.debug('Selected conversation:', selectedConversation)
  if (!selectedConversation.model || !selectedConversation.model.id) {
    console.debug('Invalid conversation:', selectedConversation)
    throw new Error('Conversation model is undefined or missing "id" property.')
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

  if (
    Object.values(NCSAHostedVLMModelID).includes(
      selectedConversation.model.id as any,
    )
  ) {
    // NCSA Hosted VLM
    return await runVLLM(
      selectedConversation,
      chatBody?.llmProviders?.NCSAHostedVLM as NCSAHostedVLMProvider,
      chatBody.stream,
    )
  } else if (
    Object.values(OllamaModelIDs).includes(selectedConversation.model.id as any)
  ) {
    // Ollama
    return await runOllamaChat(
      selectedConversation,
      chatBody!.llmProviders!.Ollama as OllamaProvider,
      chatBody.stream,
    )
  } else if (
    Object.values(AnthropicModelID).includes(
      selectedConversation.model.id as any,
    )
  ) {
    return await runAnthropicChat(
      selectedConversation,
      chatBody.llmProviders?.Anthropic as AnthropicProvider,
      chatBody.stream,
    )
  } else if (
    Object.values(OpenAIModelID).includes(
      selectedConversation.model.id as any,
    ) ||
    Object.values(AzureModelID).includes(selectedConversation.model.id as any)
  ) {
    return await openAIAzureChat(chatBody, chatBody.stream)
  } else if (
    Object.values(BedrockModelID).includes(selectedConversation.model.id as any)
  ) {
    return await runBedrockChat(
      selectedConversation,
      chatBody.llmProviders?.Bedrock as BedrockProvider,
      chatBody.stream,
    )
  } else if (
    Object.values(GeminiModelID).includes(selectedConversation.model.id as any)
  ) {
    return await runGeminiChat(
      selectedConversation,
      chatBody.llmProviders?.Gemini as GeminiProvider,
      chatBody.stream,
    )
  } else if (
    Object.values(SambaNovaModelID).includes(
      selectedConversation.model.id as any,
    )
  ) {
    return await runSambaNovaChat(
      selectedConversation,
      chatBody.llmProviders?.SambaNova as SambaNovaProvider,
      chatBody.stream,
    )
  } else {
    throw new Error(
      `Model '${selectedConversation.model.name}' is not supported.`,
    )
  }
}
