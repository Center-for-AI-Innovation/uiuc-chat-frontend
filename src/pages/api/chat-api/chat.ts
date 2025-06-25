// src/pages/api/chat-api/chat.ts

import {
  type ChatBody,
  type Content,
  type Conversation,
  type Message,
} from '~/types/chat'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { validateApiKeyAndRetrieveData } from './keys/validate'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import posthog from 'posthog-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { CourseMetadata } from '~/types/courseMetadata'
import {
  attachContextsToLastMessage,
  constructSearchQuery,
  determineAndValidateModel,
  handleContextSearch,
  handleImageContent,
  handleNonStreamingResponse,
  handleStreamingResponse,
  routeModelRequest,
  validateRequestBody,
} from '~/utils/streamProcessing'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { v4 as uuidv4 } from 'uuid'
import { getBaseUrl } from '~/utils/apiUtils'

import {
  fetchTools,
  handleToolsServer,
} from '~/utils/functionCalling/handleFunctionCalling'
import {
  type AllLLMProviders,
  type GenericSupportedModel,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { AuthContextProps } from 'react-oidc-context'
import { selectBestTemperature } from '~/components/Chat/Temperature'

/**
 * The chat API endpoint for handling chat requests and streaming/non streaming responses.
 * This function orchestrates the validation of the request, user permissions,
 * fetching of necessary data, and the construction and handling of the chat response.
 *
 * @param {NextApiRequest} req - The incoming Next.js API request object.
 * @param {NextApiResponse} res - The Next.js API response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export default async function chat(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Validate the HTTP method
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method)
    posthog.capture('stream_api_invalid_method', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      method: req.method,
    })
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Parse and validate the request body
  const body = req.body
  try {
    await validateRequestBody(body)
  } catch (error: any) {
    // Log the error and capture it with PostHog
    console.error('Invalid request body:', body, 'Error:', error.message)
    posthog.capture('Invalid Request Body', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      body: body,
      error: error.message,
    })

    // Return a response with the error message
    res.status(400).json({ error: `Invalid request body: ${error.message}` })
    return
  }

  // Destructure the necessary properties from the request body
  const {
    model,
    messages,
    temperature,
    course_name,
    stream,
    api_key,
    retrieval_only,
  }: {
    model: string
    messages: Message[]
    openai_key: string
    temperature: number
    course_name: string
    stream: boolean
    api_key: string
    retrieval_only: boolean
  } = body

  // Validate the API key and retrieve user data
  const {
    isValidApiKey,
    authContext,
  }: { isValidApiKey: boolean; authContext: AuthContextProps } =
    await validateApiKeyAndRetrieveData(api_key, course_name)

  const email = authContext.user?.profile.email

  console.debug('Received /chat request for: ', email)

  if (!isValidApiKey) {
    posthog.capture('stream_api_invalid_api_key', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      api_key: api_key,
      user_id: email,
    })
    res.status(403).json({ error: 'Invalid API key' })
    return
  }

  // Retrieve course metadata
  const courseMetadata: CourseMetadata = await fetchCourseMetadata(course_name)
  if (!courseMetadata) {
    res.status(404).json({ error: 'Course metadata not found' })
    return
  }

  // Determine and validate the model to use
  let selectedModel: GenericSupportedModel
  let llmProviders: AllLLMProviders
  try {
    const { activeModel, modelsWithProviders } =
      await determineAndValidateModel(model, course_name)
    selectedModel = activeModel
    llmProviders = modelsWithProviders
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
    return
  }

  // Check user permissions
  const permission = get_user_permission(courseMetadata, authContext)

  if (permission !== 'edit') {
    posthog.capture('stream_api_permission_denied', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      permission: permission,
      user_id: email,
    })
    res
      .status(403)
      .json({ error: 'You do not have permission to perform this action' })
    return
  }

  // Ensure there are messages in the conversation
  if (messages.length === 0) {
    console.error('No messages in conversation')
    res.status(400).json({ error: 'No messages in conversation' })
    return
  }

  // Get the last message in the conversation
  const lastMessage = messages[messages.length - 1] as Message

  // Fetch tools
  let availableTools
  if (!retrieval_only) {
    try {
      availableTools = await fetchTools(
        course_name!,
        '',
        20,
        'true',
        false,
        getBaseUrl(),
      )
    } catch (error) {
      console.error('Error fetching tools.', error)
      availableTools = []
      res
        .status(500)
        .json({ error: `Error fetching tools. ${(error as Error).message}` })
      return
    }
  }

  // Fetch document groups
  // We can fetch custom doc groups here instead, but for now we'll just use the default
  const doc_groups = ['All Documents']

  const controller = new AbortController()
  // Construct the search query
  let searchQuery = constructSearchQuery(messages)
  let imgDesc = ''

  // Construct the conversation object
  const conversation: Conversation = {
    id: uuidv4(),
    name: 'New Conversation',
    messages: messages,
    model: selectedModel,
    prompt:
      messages.filter((message) => message.role === 'system').length > 0
        ? ((messages.filter((message) => message.role === 'system')[0]
          ?.content as string) ??
          (messages.filter((message) => message.role === 'system')[0]
            ?.content as string))
        : DEFAULT_SYSTEM_PROMPT,
    temperature: selectBestTemperature(undefined, selectedModel, llmProviders),
    folderId: null,
    userEmail: email,
  }

  // Handle image content if it exists
  // Check if the content is an array and filter out image content
  const imageContent = Array.isArray(lastMessage.content)
    ? (lastMessage.content as Content[]).filter(
      (content) => content.type === 'image_url',
    )
    : []

  const imageUrls = imageContent.map(
    (content) => content.image_url?.url as string,
  )

  if (imageContent.length > 0 && !retrieval_only) {
    // convert the provided key into an OpenAI provider.
    const llmProviders = {} as AllLLMProviders
    const { searchQuery: newSearchQuery, imgDesc: newImgDesc } =
      await handleImageContent(
        lastMessage,
        course_name,
        conversation,
        searchQuery,
        llmProviders,
        controller,
      )
    searchQuery = newSearchQuery
    imgDesc = newImgDesc
  }

  // Fetch Contexts
  console.log('Before context search:', {
    courseName: course_name,
    searchQuery,
    documentGroups: doc_groups,
  })
  const contexts = await handleContextSearch(
    lastMessage,
    course_name,
    conversation,
    searchQuery,
    doc_groups,
  )
  // Check if contexts were found
  if (contexts.length === 0) {
    console.error('No contexts found')
    posthog.capture('stream_api_no_contexts_found', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_id: email,
    })
    // res.status(500).json({ error: 'No contexts found' })
    // return
  } else {
    if (retrieval_only) {
      res.status(200).json({ contexts: contexts })
      return
    }

    // Attach contexts to the last message
    attachContextsToLastMessage(lastMessage, contexts)
  }

  // Handle tools
  let updatedConversation = conversation
  if (availableTools.length > 0) {
    updatedConversation = await handleToolsServer(
      lastMessage,
      availableTools,
      imageUrls,
      imgDesc,
      conversation,
      llmProviders[ProviderNames.OpenAI]?.apiKey as string,
      course_name,
      getBaseUrl(),
    )
  }

  const chatBody: ChatBody = {
    conversation,
    key: llmProviders[ProviderNames.OpenAI]?.apiKey as string,
    course_name,
    stream,
    courseMetadata,
    llmProviders,
    mode: 'chat',
  }

  // Build the prompt
  const buildPromptResponse = await buildPrompt({
    conversation: chatBody.conversation!,
    projectName: chatBody.course_name,
    courseMetadata: chatBody.courseMetadata,
    summary: false,
  })

  chatBody.conversation = buildPromptResponse

  // Make the API request to the chat handler
  const baseUrl = getBaseUrl()
  const apiResponse = await routeModelRequest(chatBody, controller, baseUrl)

  // Handle errors from the chat handler API
  if (!apiResponse.ok) {
    console.error('API error:', apiResponse.statusText)
    posthog.capture('stream_api_error', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      error: apiResponse.statusText,
      status: apiResponse.status,
      user_id: email,
    })
    res
      .status(apiResponse.status)
      .json({ error: `API error: ${apiResponse.statusText}` })
    return
  }

  // Stream the response or return it as a single message
  if (stream) {
    posthog.capture('stream_api_streaming_started', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_id: email,
    })
    await handleStreamingResponse(
      apiResponse,
      conversation,
      req,
      res,
      course_name,
    )
  } else {
    posthog.capture('stream_api_response_sent', {
      distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_id: email,
    })
    await handleNonStreamingResponse(
      apiResponse,
      conversation,
      req,
      res,
      course_name,
    )
  }
}
