import { type CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
import {
  type Content,
  type ContextWithMetadata,
  type Conversation,
  type MessageType,
  type OpenAIChatMessage,
  type UIUCTool,
} from '@/types/chat'
import { AnySupportedModel } from '~/utils/modelProviders/LLMProvider'
import {
  DEFAULT_SYSTEM_PROMPT,
  GUIDED_LEARNING_PROMPT,
  DOCUMENT_FOCUS_PROMPT,
} from '@/utils/app/const'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'

import { encodingForModel } from 'js-tiktoken'
import { v4 as uuidv4 } from 'uuid'

// Define interface for URL link parameters
interface LinkParameters {
  guidedLearning?: boolean
  documentsOnly?: boolean
  systemPromptOnly?: boolean
}

// Helper functions for feature flags
const isGuidedLearningEnabled = (
  conversation: Conversation,
  courseMetadata?: CourseMetadata,
): boolean => {
  return !!(
    conversation.linkParameters?.guidedLearning ||
    courseMetadata?.guidedLearning
  )
}

const isDocumentsOnlyEnabled = (
  conversation: Conversation,
  courseMetadata?: CourseMetadata,
): boolean => {
  return !!(
    conversation.linkParameters?.documentsOnly || courseMetadata?.documentsOnly
  )
}

const isSystemPromptOnlyEnabled = (
  conversation: Conversation,
  courseMetadata?: CourseMetadata,
): boolean => {
  return !!(
    conversation.linkParameters?.systemPromptOnly ||
    courseMetadata?.systemPromptOnly
  )
}

const shouldAppendGuidedLearningPrompt = (
  conversation: Conversation,
  courseMetadata?: CourseMetadata,
): boolean => {
  return !!(
    conversation.linkParameters?.guidedLearning &&
    !courseMetadata?.guidedLearning
  )
}

const shouldAppendDocumentsOnlyPrompt = (
  conversation: Conversation,
  courseMetadata?: CourseMetadata,
): boolean => {
  return !!(
    conversation.linkParameters?.documentsOnly && !courseMetadata?.documentsOnly
  )
}

const googleFitData = {
  '1': {
    timeCreated: '2024-01-01T00:00:00Z',
    timeDuration: '24 hours',
    avgHeartRate: 70,
    maxHeartRate: 100,
    restingHeartRate: 60,
    stepCount: 1000,
    calories: 2000,
    distance: 10,
    floors: 2,
    activeMinutes: 30,
    caloriesBurned: 1500,
    sleepDuration: 8,
    sleepQuality: 0.8,
    sleepStages: {
      deep: 2,
      light: 3,
      rem: 1,
    },
    workoutDurationHours: 0.5,
    workoutType: 'run',
    workoutDistance: '5 miles',
    workoutCalories: 1000,
    workoutSteps: 5000,
    workoutFloors: 2,
    workoutActiveMinutes: 30,
    workoutAvgHeartRate: 100,
    workoutMaxHeartRate: 120,
    workoutRestingHeartRate: 60,
    workoutAvgSpeed: '10 mph',
    workoutMaxSpeed: '15 mph',
    workoutAvgPace: '1 min/mile',
    workoutMaxPace: '1.5 min/mile',
    workoutAvgStrideLength: '1 ft',
    workoutMaxStrideLength: '1.5 ft',
    workoutAvgStrideTime: '1 sec',
    workoutMaxStrideTime: '1.5 sec',
    workoutAvgStrideSpeed: '10 mph',
    workoutMaxStrideSpeed: '15 mph',
  },
  '2': {
    timeCreated: '2024-01-02T00:00:00Z',
    timeDuration: '48 hours',
    avgHeartRate: 70,
    maxHeartRate: 100,
    restingHeartRate: 60,
    stepCount: 5000,
    calories: 5000,
    distance: 20,
    floors: 2,
    activeMinutes: 30,
    caloriesBurned: 1500,
    sleepDuration: 6,
    sleepQuality: 0.6,
    sleepStages: {
      deep: 1,
      light: 2,
      rem: 1,
    },
    workoutDurationHours: 1,
    workoutType: 'swim',
    workoutDistance: '10 miles',
    workoutCalories: 1500,
    workoutActiveMinutes: 30,
    workoutAvgHeartRate: 100,
    workoutMaxHeartRate: 120,
    workoutRestingHeartRate: 60,
  },
}

const profile = {
  '1': {
    name: 'John Doe',
    age: 30,
    gender: 'male',
    height: 180,
    weight: 70,
    bmi: 24.5,
    bmr: 1800,
    tdee: 2200,
    medication: 'None',
    allergies: 'None',
    medicalHistory: [
      'Diagnosed with mild hypertension (monitors blood pressure regularly)',
      'Type 2 diabetes, managed through diet, exercise, and medication',
      'Torn rotator cuff in the right shoulder (recovered after surgery 8 months ago, avoids heavy lifting)',
      'Occasional lower back discomfort, aggravated by prolonged sitting',
      'Focuses on maintaining cardiovascular health and managing weight',
    ],
    personality: {
      likes: [
        'Enjoys brisk walking and cycling on his stationary bike',
        'Prefers structured routines with clear goals, such as daily step targets',
        'Likes being outdoors, especially hiking on weekends',
        'Enjoys morning exercise sessions and appreciates a daily reminder from the chatbot',
        'Finds satisfaction in tracking progress, especially when he sees improvements in blood sugar levels',
      ],
      dislikes: [
        'Dislikes heavy strength training and avoids exercises that strain his shoulder',
        "Doesn't like late afternoon workouts; feels more sluggish and unmotivated later in the day",
        'Avoids exercises that are too complex or require too much coordination (prefers simplicity)',
      ],
      preferences: [
        'Prefers short, straightforward conversations with the chatbot, focusing on health tips and step count reminders',
        'Motivated by seeing tangible health improvements, like lower blood pressure or stable blood sugar',
        'Enjoys setting specific goals, such as increasing his step count gradually each week',
        'Responds well to positive reinforcement, especially for consistency in routine',
      ],
      goals: 'Maintaining cardiovascular health and managing weight',
    },
  },
}

const getUserGoogleFitData = (userID: string) => {
  return googleFitData[userID as keyof typeof googleFitData]
}

const getUserProfile = (userID: string) => {
  return profile[userID as keyof typeof profile]
}

const encoding = encodingForModel('gpt-4o')

export type BuildPromptMode = 'chat' | 'optimize_prompt'

export const buildPrompt = async ({
  conversation,
  projectName,
  courseMetadata,
  summary,
  mode,
}: {
  conversation: Conversation | undefined
  projectName: string
  courseMetadata: CourseMetadata | undefined
  summary: boolean | undefined
  mode?: BuildPromptMode
}): Promise<Conversation> => {
  /*
    System prompt -- defined by user. If documents are provided, add the citations instructions to it.
  
    Priorities for building prompt w/ limited window:
    1. ✅ Most recent user text input & images/img-description (depending on model support for images)
    1.5. LLM memory - Key for follow-up questions: 
      1.5.1. ✅ Conversation summary - running summary of the last user query and assistant answer + previous conversation summary. 
      1.5.2. ❌ Last 1 or 2 conversation history. At least the user message and the AI response.
    2. ✅ Image description
    3. ✅ Tool result
    4. ✅ query_topContext (if documents are retrieved)
    5. Image_topContext
    6. Tool_topContext
    7. ✅ Conversation history
    */
  if (conversation == undefined) {
    throw new Error('Conversation is undefined when building prompt.')
  }

  // Check if encoding is initialized
  if (!encoding) {
    console.error('Encoding is not initialized.')
    throw new Error('Encoding initialization failed.')
  }

  // console.log('conversation in BuildPromptUtils: ', conversation)

  let remainingTokenBudget = conversation.model.tokenLimit - 1500 // Save space for images, OpenAI's handling, etc.

  try {
    // Execute asynchronous operations in parallel and await their results
    if (mode === 'optimize_prompt') {
      // Extract system messages from conversation history
      const systemMessagesFromHistory = _extractSystemMessages(conversation)

      if (systemMessagesFromHistory && conversation.messages.length > 0) {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1]
        if (lastMessage && lastMessage.role === 'user') {
          lastMessage.latestSystemMessage = systemMessagesFromHistory
          lastMessage.finalPromtEngineeredMessage =
            typeof lastMessage.content === 'string' ? lastMessage.content : ''
        }
      }
      return conversation
    }
    const allPromises = []
    allPromises.push(_getLastUserTextInput({ conversation }))
    allPromises.push(_getLastToolResult({ conversation }))
    allPromises.push(_getSystemPrompt({ courseMetadata, conversation }))
    const [lastUserTextInput, lastToolResult, systemPrompt] =
      (await Promise.all(allPromises)) as [
        string,
        UIUCTool[],
        string | undefined,
      ]

    // Build the final system prompt with all components
    let finalSystemPrompt = ''
    // Adjust remaining token budget based on the system prompt length
    if (encoding) {
      const tokenCount = encoding.encode(finalSystemPrompt).length
      remainingTokenBudget -= tokenCount
    }

    // --------- <USER PROMPT> ----------
    // Initialize an array to collect sections of the user prompt
    const userPromptSections: string[] = []

    if (!true) {
      // Hard-coding this to false for now
      console.log('Call for summarization')
      // build prompt for summarization
      finalSystemPrompt =
        'You are a helpful assistant that summarizes content. Summarize the content in 3 sentences'

      // Adjust remaining token budget based on the system prompt length
      const tokenCount = encoding.encode(finalSystemPrompt).length
      remainingTokenBudget -= tokenCount

      // P1 : get the previous conversation summary, if it exists
      if (conversation.summary) {
        const previousConversationSummary = `\n<Previous Conversation Summary>\n${conversation.summary}\n</Previous Conversation Summary>`
        userPromptSections.push(previousConversationSummary)
        remainingTokenBudget -= encoding.encode(
          previousConversationSummary,
        ).length
      }
      // P2 : get the most recent user text input
      const userQuery = `\n<User Query>\n${lastUserTextInput}\n</User Query>`
      remainingTokenBudget -= encoding.encode(userQuery).length
      userPromptSections.push(userQuery)

      // P3.1 : get the last assistant message
      const lastAssistantMessage: string | Content[] =
        conversation?.messages
          .filter((msg) => msg.role === 'assistant')
          .slice(-1)[0]?.content || ''
      // P3.2 : get the last assistant message text
      let cleanedAssistantMessage = ''
      if (
        Array.isArray(lastAssistantMessage) &&
        lastAssistantMessage.every(
          (item) =>
            typeof item === 'object' && 'type' in item && 'text' in item,
        )
      ) {
        // Get the last element of the array
        const lastElement = lastAssistantMessage.slice(-1)[0]
        if (lastElement?.type === 'text') {
          cleanedAssistantMessage = lastElement.text || ''
        }
      } else if (typeof lastAssistantMessage === 'string') {
        cleanedAssistantMessage = lastAssistantMessage
      }
      // P3.3 : Remove "References:" section from assistant message if it exists
      const referencesIndex = cleanedAssistantMessage.search(
        /References:|Relevant Sources:/,
      ) // TODO: make this search string more robust
      cleanedAssistantMessage =
        referencesIndex !== -1
          ? cleanedAssistantMessage.substring(0, referencesIndex).trim()
          : cleanedAssistantMessage

      const answer = `\n<Answer>\n${cleanedAssistantMessage}\n</Answer>`
      remainingTokenBudget -= encoding.encode(answer).length
      userPromptSections.push(answer)
    } else {
      // normal flow without summary
      // Build the final system prompt with all components
      finalSystemPrompt = systemPrompt ?? DEFAULT_SYSTEM_PROMPT ?? ''
      // Adjust remaining token budget based on the system prompt length
      const tokenCount = encoding.encode(finalSystemPrompt).length
      remainingTokenBudget -= tokenCount

      // P1.1: Most recent user text input
      const userQuery = `\n<User Query>\n${lastUserTextInput}\n</User Query>`
      remainingTokenBudget -= encoding.encode(userQuery).length
      userPromptSections.push(userQuery)

      // P1.2: User GoogleFit Data
      const user_data = getUserGoogleFitData('1')
      const user_data_str = JSON.stringify(user_data)
      const userData = `\nBelow is the user's GoogleFit health and workoutdata. Use this data to answer the user's question.\n<User Data>\n${user_data_str}\n</User Data>`
      remainingTokenBudget -= encoding.encode(userData).length
      userPromptSections.push(userData)

      // P1.3: User Profile
      const userProfile = getUserProfile('1')
      const userProfileStr = JSON.stringify(userProfile)
      const userProfileData = `\nBelow is the user's profile. Use this data to answer the user's question.\n<User Profile>\n${userProfileStr}\n</User Profile>`
      remainingTokenBudget -= encoding.encode(userProfileData).length
      userPromptSections.push(userProfileData)

      // P2.1 : get the previous conversation summary, if it exists
      if (conversation.summary) {
        const previousConversationSummary = `\n<Previous Conversation Summary>\n${conversation.summary}\n</Previous Conversation Summary>`
        userPromptSections.push(previousConversationSummary)
        remainingTokenBudget -= encoding.encode(
          previousConversationSummary,
        ).length
      }

      // P2.2: Latest 2 conversation messages (Reserved tokens)
      const tokensInLastTwoMessages = _getRecentConvoTokens({
        conversation,
      })
      // console.log('Tokens in last two messages: ', tokensInLastTwoMessages)
      remainingTokenBudget -= tokensInLastTwoMessages

      // Get contexts from the last message
      const contexts =
        (conversation.messages[conversation.messages.length - 1]
          ?.contexts as ContextWithMetadata[]) || []

      if (contexts && contexts.length > 0) {
        // Documents are present; maintain all existing processes as normal
        // P5: query_topContext

        const query_topContext = _buildQueryTopContext({
          conversation: conversation,
          // encoding: encoding,
          tokenLimit: remainingTokenBudget - tokensInLastTwoMessages, // Keep room for conversation history
        })

        if (query_topContext) {
          const queryContextMsg = `
          <RetrievedDocumentsInstructions>
          The following are passages retrieved via RAG from a large dataset. They may be relevant but aren't guaranteed to be. Evaluate critically, use what's pertinent, disregard irrelevant info. Cite used passages carefully in the format previously described.
          </RetrievedDocumentsInstructions>
          
          <PotentiallyRelevantDocuments>
          ${query_topContext}
          </PotentiallyRelevantDocuments>`
          // Adjust remaining token budget
          remainingTokenBudget -= encoding.encode(queryContextMsg).length
          // Add to user prompt sections
          userPromptSections.push(queryContextMsg)
        }
      }

      const latestUserMessage =
        conversation.messages[conversation.messages.length - 1]

      // No tools use in mHealth
      // Move Tool Outputs to be added before the userQuery
      // if (latestUserMessage?.tools) {
      //   const toolsOutputResults = _buildToolsOutputResults({ conversation })

      //   // Add Tool Instructions and outputs
      //   const toolInstructions =
      //     "<Tool Instructions>The user query required the invocation of external tools, and now it's your job to use the tool outputs and any other information to craft a great response. All tool invocations have already been completed before you saw this message. You should not attempt to invoke any tools yourself; instead, use the provided results/outputs of the tools. If any tools errored out, inform the user. If the tool outputs are irrelevant to their query, let the user know. Use relevant tool outputs to craft your response. The user may or may not reference the tools directly, but provide a helpful response based on the available information. Never tell the user you will run tools for them, as this has already been done. Always use the past tense to refer to the tool outputs. Never request access to the tools, as you are guaranteed to have access when appropriate; for example, never say 'I would need access to the tool.' When using tool results in your answer, always specify the source, using code notation, such as '...as per tool `tool name`...' or 'According to tool `tool name`...'. Never fabricate tool results; it is crucial to be honest and transparent. Stick to the facts as presented.</Tool Instructions>"

      //   // Add to user prompt sections
      //   userPromptSections.push(toolInstructions)

      //   // Adjust remaining token budget for tool outputs
      //   remainingTokenBudget -= encoding.encode(toolsOutputResults).length

      //   // Add tool outputs to user prompt sections
      //   userPromptSections.push(toolsOutputResults)
      // }
    } // end summary if-else here

    // Assemble the user prompt by joining sections with double line breaks
    const userPrompt = userPromptSections.join('\n\n')

    // if (summary) {
    //   console.debug('Summary userPrompt: ', userPrompt)
    //   console.debug('Summary finalSystemPrompt: ', finalSystemPrompt)
    // } else {
    //   console.debug('Normal userPrompt: ', userPrompt)
    //   console.debug('Normal finalSystemPrompt: ', finalSystemPrompt)
    // }

    // Set final system and user prompts in the conversation
    conversation.messages[
      conversation.messages.length - 1
    ]!.finalPromtEngineeredMessage = userPrompt

    conversation.messages[
      conversation.messages.length - 1
    ]!.latestSystemMessage = finalSystemPrompt
    if (summary) {
      // change last message role to user
      // this is for convertConversatonToVercelAISDKv3. Only the "user" role finalPromtEngineeredMessage is used.
      // Here since the summary message is from assistant, we need to change it to user.
      conversation.messages[conversation.messages.length - 1]!.role = 'user'
    }

    return conversation
  } catch (error) {
    console.error('Error in buildPrompt:', error)
    throw error
  }
}

const _getRecentConvoTokens = ({
  conversation,
}: {
  conversation: Conversation
}): number => {
  if (!encoding) {
    throw new Error('Encoding is not initialized.')
  }

  // Your existing logic using 'encoding'
  return conversation.messages.slice(-4).reduce((acc, message) => {
    let content: string
    if (typeof message.content === 'string') {
      content = message.content
    } else {
      content = ''
    }

    if (!encoding) {
      throw new Error('Encoding is null')
    }
    const tokens = encoding.encode(content).length
    return acc + tokens
  }, 0)
}

const _buildToolsOutputResults = ({
  conversation,
}: {
  conversation: Conversation
}): string => {
  let toolOutputResults = ''
  const latestUserMessage =
    conversation.messages[conversation.messages.length - 1]

  if (latestUserMessage?.tools) {
    // Add tool output to user query
    let toolMsg = `The following API(s), aka tool(s), were invoked, and here's the tool output(s). Remember, use this information when relevant in crafting your response. The user may or may not reference the tool directly, either way provide a helpful response and infer what they want based on the information you have available. Never tell the user "I will run theses for you" because they have already run! Always use past tense to refer to the tool outputs. NEVER request access to the tools because you are guarenteed to have access when appropraite; e.g. nevery say "I would need access to the tool." When using tool results in your answer, always tell the user the answer came from a specific tool name and cite it using code notation something like '... as per tool \`tool name\`...' or 'According to tool \`tool name\` ...'.\n<Tool Outputs>\n`
    latestUserMessage?.tools?.forEach((tool) => {
      let toolOutput = ''
      if (tool.output && tool.output.text) {
        toolOutput += `Tool: ${tool.readableName}\nOutput: ${tool.output.text}\n`
      } else if (tool.output && tool.output.imageUrls) {
        toolOutput += `Tool: ${tool.readableName}\nOutput: Images were generated by this tool call and the generated image(s) is/are provided below`
        // Add image urls to message content
        ;(latestUserMessage.content as Content[]).push(
          ...tool.output.imageUrls.map((imageUrl) => ({
            type: 'tool_image_url' as MessageType,
            image_url: { url: imageUrl },
          })),
        )
      } else if (tool.output && tool.output.data) {
        toolOutput += `Tool: ${tool.readableName}\nOutput: ${JSON.stringify(tool.output.data)}\n`
      } else if (tool.error) {
        toolOutput += `Tool: ${tool.readableName}\n${tool.error}\n`
      }
      toolMsg += toolOutput
    })
    if (toolMsg.length > 0) {
      toolOutputResults += toolMsg + '</Tool Outputs>\n'
      return toolOutputResults
    }
  }
  return 'No tools used.'
}

const _buildConvoHistory = ({
  conversation,
  tokenLimit,
  // encoding,
}: {
  conversation: Conversation
  tokenLimit: number
  // encoding: Tiktoken
}): OpenAIChatMessage[] => {
  let tokenCount = 0
  let messagesToSend: OpenAIChatMessage[] = []
  const messages = conversation.messages

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message) {
      let content: string
      if (typeof message.content === 'string') {
        content = message.content
      } else {
        // image descriptions
        content = message.content.map((c) => c.text || '').join(' ')
      }
      const tokens = encoding.encode(content)

      if (tokenCount + tokens.length + 1000 > tokenLimit) {
        break
      }
      tokenCount += tokens.length
      messagesToSend = [
        { role: message.role, content: message.content as Content[] },
        ...messagesToSend,
      ]
    }
  }
  return messagesToSend
}

const _getLastUserTextInput = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<string> => {
  /* 
      Gets ONLY the text that the user input. Does not return images or anything else. Just what the user typed.
    */
  // const lastMessageContent =
  //   conversation.messages?.[conversation.messages.length - 1]?.content

  const lastMessageContent: string | Content[] =
    conversation?.messages.filter((msg) => msg.role === 'user').slice(-1)[0]
      ?.content || ''
  if (typeof lastMessageContent === 'string') {
    return lastMessageContent
  } else if (Array.isArray(lastMessageContent)) {
    return lastMessageContent.map((content) => content.text || '').join('\n')
  }
  throw new Error('No user input found')
}

function _buildQueryTopContext({
  conversation,
  // encoding,
  tokenLimit = 8000,
}: {
  conversation: Conversation
  // encoding: Tiktoken
  tokenLimit: number
}) {
  try {
    const contexts = conversation.messages[conversation.messages.length - 1]
      ?.contexts as ContextWithMetadata[]

    if (!contexts || !Array.isArray(contexts) || contexts.length === 0) {
      return undefined
    }

    let tokenCounter = 0
    const validDocs = []
    for (const [index, d] of Array.from(contexts).entries()) {
      const docString = `---\n${index + 1}: ${d.readable_filename}${
        d.pagenumber ? ', page: ' + d.pagenumber : ''
      }\n${d.text}\n`
      const numTokens = encoding.encode(docString).length

      if (tokenCounter + numTokens <= tokenLimit) {
        tokenCounter += numTokens
        validDocs.push({ index, d })
      } else {
        continue
      }
    }

    const separator = '---\n' // between each context
    const contextText = validDocs
      .map(
        ({ index, d }) =>
          `${index + 1}: ${d.readable_filename}${
            d.pagenumber ? ', page: ' + d.pagenumber : ''
          }\n${d.text}\n`,
      )
      .join(separator)

    return contextText
  } catch (e) {
    console.error(`Error in getStuffedPrompt: ${e}`)
    throw e
  }
}

const _getLastToolResult = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<UIUCTool[] | undefined> => {
  const toolResults: UIUCTool[] = conversation.messages?.[
    conversation.messages.length - 1
  ]?.tools as UIUCTool[]
  return toolResults
}

const _getSystemPrompt = async ({
  courseMetadata,
  conversation,
}: {
  courseMetadata: CourseMetadata | undefined
  conversation: Conversation
}): Promise<string> => {
  // First get the user defined system prompt
  let userDefinedSystemPrompt: string | undefined | null
  if (courseMetadata?.system_prompt) {
    userDefinedSystemPrompt = courseMetadata.system_prompt
  } else {
    userDefinedSystemPrompt = await getCourseMetadata(conversation.name)
      .then((metadata) => metadata?.system_prompt)
      .catch((error) => {
        console.warn('Failed to fetch course metadata:', error)
        return undefined
      })
  }

  // Start with either user defined prompt or default
  let systemPrompt = userDefinedSystemPrompt ?? DEFAULT_SYSTEM_PROMPT ?? ''

  // If systemPromptOnly is true, don't add additional prompts except for guided learning and documents only
  if (isSystemPromptOnlyEnabled(conversation, courseMetadata)) {
    // Even with systemPromptOnly, we should still add guided learning if enabled locally but not course-wide
    if (shouldAppendGuidedLearningPrompt(conversation, courseMetadata)) {
      systemPrompt += GUIDED_LEARNING_PROMPT
    }

    // Add documents only prompt if enabled via link parameters but not course-wide
    if (shouldAppendDocumentsOnlyPrompt(conversation, courseMetadata)) {
      systemPrompt += DOCUMENT_FOCUS_PROMPT
    }

    return systemPrompt
  }

  // Add guided learning prompt if enabled via conversation but not course-wide
  if (shouldAppendGuidedLearningPrompt(conversation, courseMetadata)) {
    systemPrompt += GUIDED_LEARNING_PROMPT
  }

  // Add documents only prompt if enabled via link parameters but not course-wide
  if (shouldAppendDocumentsOnlyPrompt(conversation, courseMetadata)) {
    systemPrompt += DOCUMENT_FOCUS_PROMPT
  }

  // Check if contexts are present
  const contexts =
    (conversation.messages[conversation.messages.length - 1]
      ?.contexts as ContextWithMetadata[]) || []

  if (!contexts || contexts.length === 0) {
    // No documents retrieved, return only system prompt
    return systemPrompt.trim()
  } else {
    // Documents are present, combine system prompt with system post prompt
    const systemPostPrompt = getSystemPostPrompt({
      conversation: conversation as Conversation,
      courseMetadata: courseMetadata ?? ({} as CourseMetadata),
    })
    return [systemPrompt, systemPostPrompt]
      .filter((prompt) => prompt?.trim())
      .join('\n\n')
  }
}

export const getSystemPostPrompt = ({
  conversation,
  courseMetadata,
}: {
  conversation: Conversation
  courseMetadata: CourseMetadata
}): string => {
  // If systemPromptOnly is true, return an empty string
  if (isSystemPromptOnlyEnabled(conversation, courseMetadata)) {
    return ''
  }

  const isGuidedLearning = isGuidedLearningEnabled(conversation, courseMetadata)
  const isDocumentsOnly = isDocumentsOnlyEnabled(conversation, courseMetadata)

  const postPrompt =
    `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be PDF files or web pages. You may also see output from API calls (labeled as "tools") and image descriptions. Use this information to craft a detailed and accurate answer.

When referencing information from the documents, you MUST include citations in your response. Citations should be placed at the end of complete thoughts, immediately before the period. For each distinct piece of information or section, cite the relevant source(s) using XML-style citation tags in the following format:
- Use "<cite>1</cite>" when referencing document 1, placing it immediately before the period
- For multiple sources, include all citation numbers within a single tag, separated by commas: "<cite>1, 2, 3</cite>"

Here are examples of how to properly integrate citations in your response:
- "The loop invariant is a condition that must be true before and after each iteration of the loop. This fundamental concept helps prove the correctness of loop-based algorithms <cite>1</cite>."
- "Python lists are implemented as dynamic arrays. When the allocated space is filled, Python will automatically resize the array to accommodate more elements <cite>2</cite>."
- "The course has a strict late submission policy. All assignments are due every Friday by 11:59 PM, and late submissions will incur a 10% penalty per day <cite>3</cite>."
- "Object-oriented programming combines data and functionality into objects, while functional programming treats computation as the evaluation of mathematical functions and avoids changing state <cite>1, 3</cite>."

Citations should be placed at the end of complete thoughts or sections, immediately before the period if applicable. This makes the text more readable while still maintaining clear attribution of information. Break down information into logical sections and cite the sources at the end of each complete thought.

Note: You may see citations in the conversation history that appear differently due to post-processing formatting. Regardless of how they appear in previous messages, always use the XML-style citation format specified above in your responses.

${
  isGuidedLearning
    ? 'IMPORTANT: While in guided learning mode, you must still cite all relevant course materials using the exact citation format—even if they contain direct answers. Never filter out or omit relevant materials.'
    : ''
}

${
  !isGuidedLearning && !isDocumentsOnly
    ? 'If the answer is not in the provided documents, state so but still provide as helpful a response as possible to directly answer the question.'
    : ''
}

When using tool outputs in your response, place the tool reference at the end of the relevant statement, before the period, using code notation. For example: "The repository contains three JavaScript files \`as per tool ls\`." Always be honest and transparent about tool results.

The user message includes XML-style tags (e.g., <Potentially Relevant Documents>, <Tool Outputs>). Make sure to integrate this information appropriately in your answer.`.trim()

  return postPrompt
}

export const getDefaultPostPrompt = (): string => {
  // The default values for courseMetadata
  const defaultCourseMetadata: CourseMetadata = {
    is_private: false,
    course_owner: '',
    course_admins: [],
    approved_emails_list: [],
    example_questions: undefined,
    banner_image_s3: undefined,
    course_intro_message: undefined,
    system_prompt: undefined,
    openai_api_key: undefined, // TODO: remove
    disabled_models: undefined, // TODO: remove
    project_description: undefined,
    documentsOnly: false,
    guidedLearning: false,
    systemPromptOnly: false,
    vector_search_rewrite_disabled: false,
  }

  // Call getSystemPostPrompt with default values
  return getSystemPostPrompt({
    conversation: {
      id: uuidv4(),
      name: '',
      messages: [],
      model: {} as AnySupportedModel,
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      folderId: null,
      linkParameters: {
        guidedLearning: false,
        documentsOnly: false,
        systemPromptOnly: false,
      },
    } as Conversation,
    courseMetadata: defaultCourseMetadata,
  })
}

const _extractSystemMessages = (conversation: Conversation): string => {
  const systemMessages = conversation.messages
    .filter((message) => message.role === 'system')
    .map((message) => {
      if (typeof message.content === 'string') {
        return message.content
      } else if (Array.isArray(message.content)) {
        return message.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n')
      }
      return ''
    })
    .filter((content) => content.length > 0)

  return systemMessages.join('\n\n')
}
