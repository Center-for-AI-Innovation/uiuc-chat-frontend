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
import { NextApiRequest, NextApiResponse } from 'next'
import { type AnySupportedModel } from '~/utils/modelProviders/LLMProvider'
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

const encoding = encodingForModel('gpt-4o')

export type BuildPromptMode = 'chat' | 'optimize_prompt'

export const buildPrompt = async ({
  conversation,
  projectName,
  courseMetadata,
  mode,
  agentMode,
}: {
  conversation: Conversation | undefined
  projectName: string
  courseMetadata: CourseMetadata | undefined
  mode?: BuildPromptMode
  agentMode?: boolean
}): Promise<Conversation> => {
  /*
    System prompt -- defined by user. If documents are provided, add the citations instructions to it.
  
    Priorities for building prompt w/ limited window:
    1. ✅ Most recent user text input & images/img-description (depending on model support for images)
    1.5. ❌ Last 1 or 2 conversation history. At least the user message and the AI response. Key for follow-up questions.
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

  let remainingTokenBudget = conversation.model.tokenLimit - 1500 // Save space for images, OpenAI's handling, etc.

  try {
    // Execute asynchronous operations in parallel and await their results
    if (mode === 'optimize_prompt') {
      // Extract system messages from conversation history
      const systemMessagesFromHistory = conversation.messages
        .filter((m) => m.latestSystemMessage)
        .map((m) => m.latestSystemMessage)
        .join('\n\n')

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
    const [lastUserTextInput, lastToolResult, systemPromptRaw] =
      (await Promise.all(allPromises)) as [
        string,
        UIUCTool[],
        string | undefined,
      ]

    // Build the final system prompt with all components
    let finalSystemPrompt = systemPromptRaw ?? DEFAULT_SYSTEM_PROMPT ?? ''

    if (agentMode) {
      const AGENT_CORE_INSTRUCTIONS = `\n\n<AgentMode>
You can plan and execute multiple tool calls sequentially or in parallel as needed. Prefer exhaustive evidence gathering from tools and retrieved documents before drafting the final answer. If multiple tools are relevant, include all of them with complete, explicit arguments. Ask for clarification only when inputs are truly ambiguous. The final response should be structured, well-organized, and comprehensive. Always keep citations in the specified XML format (<cite>1</cite>) when referencing retrieved documents, and clearly indicate any information derived from tools using code-formatted tool names.
</AgentMode>`
      finalSystemPrompt += AGENT_CORE_INSTRUCTIONS
    }

    // Adjust remaining token budget based on the system prompt length
    if (encoding) {
      const tokenCount = encoding.encode(finalSystemPrompt).length
      remainingTokenBudget -= tokenCount
    }

    // --------- <USER PROMPT> ----------
    // Initialize an array to collect sections of the user prompt
    const userPromptSections: string[] = []

    // P1: Most recent user text input
    const userQuery = `\n<User Query>\n${lastUserTextInput}\n</User Query>`
    if (encoding) {
      remainingTokenBudget -= encoding.encode(userQuery).length
    }

    // P2: Latest 2 conversation messages (Reserved tokens)
    const tokensInLastTwoMessages = _getRecentConvoTokens({
      conversation,
    })
    // console.log('Tokens in last two messages: ', tokensInLastTwoMessages)
    remainingTokenBudget -= tokensInLastTwoMessages

    // Get contexts from the last message
    const contexts =
      (conversation.messages[conversation.messages.length - 1]
        ?.contexts as ContextWithMetadata[]) || []

    if (!agentMode && contexts && contexts.length > 0) {
      // Documents are present; maintain all existing processes as normal
      // P5: query_topContext

      // Check if encoding is initialized
      if (!encoding) {
        console.error('Encoding is not initialized.')
        throw new Error('Encoding initialization failed.')
      }

      const query_topContext = _buildQueryTopContext({
        conversation: conversation,
        // encoding: encoding,
        tokenLimit: remainingTokenBudget - tokensInLastTwoMessages, // Keep room for conversation history
      })

      if (query_topContext) {
        const queryContextMsg = `
        <RetrievedDocumentsInstructions>
        The following are passages retrieved via RAG from a large dataset. They may be relevant but aren't guaranteed to be. Evaluate critically, use what's pertinent, and disregard irrelevant info. When using information from these passages, place citations before the period, using the exact same XML citation format shown in the examples above (e.g., "This is a statement <cite>1</cite>.").
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

    // Move Tool Outputs to be added before the userQuery
    if (!agentMode && latestUserMessage?.tools) {
      const toolsOutputResults = _buildToolsOutputResults({ conversation })

      // Add Tool Instructions and outputs
      const toolInstructions =
        "<Tool Instructions>The user query required the invocation of external tools, and now it's your job to use the tool outputs and any other information to craft a great response. All tool invocations have already been completed before you saw this message. You should not attempt to invoke any tools yourself; instead, use the provided results/outputs of the tools. If any tools errored out, inform the user. If the tool outputs are irrelevant to their query, let the user know. Use relevant tool outputs to craft your response. The user may or may not reference the tools directly, but provide a helpful response based on the available information. Never tell the user you will run tools for them, as this has already been done. Always use the past tense to refer to the tool outputs. Never request access to the tools, as you are guaranteed to have access when appropriate; for example, never say 'I would need access to the tool.' When using tool results in your answer, always specify the source, using code notation, such as '...as per tool `tool name`...' or 'According to tool `tool name`...'. Never fabricate tool results; it is crucial to be honest and transparent. Stick to the facts as presented.</Tool Instructions>"

      // Add to user prompt sections
      userPromptSections.push(toolInstructions)

      // Adjust remaining token budget for tool outputs
      if (encoding) {
        remainingTokenBudget -= encoding.encode(toolsOutputResults).length
      }

      // Add tool outputs to user prompt sections
      userPromptSections.push(toolsOutputResults)
    }

    // Add the user's query to the prompt sections
    userPromptSections.push(userQuery)

    // Assemble the user prompt by joining sections with double line breaks
    const userPrompt = userPromptSections.join('\n\n')

    // Set final system and user prompts in the conversation
    conversation.messages[
      conversation.messages.length - 1
    ]!.finalPromtEngineeredMessage = userPrompt

    conversation.messages[
      conversation.messages.length - 1
    ]!.latestSystemMessage = finalSystemPrompt

    return conversation
  } catch (error) {
    console.error('Error in buildPrompt:', error)
    throw error
  }
}

export function getDefaultPostPrompt(): string {
  return `Please provide a clear, concise, and well-structured answer. Use bullet points where helpful, include citations like <cite>1</cite> when referencing retrieved documents, and avoid unsupported claims.`
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
      const outputs = Array.isArray(tool.output)
        ? tool.output
        : tool.output
          ? [tool.output]
          : []

      if (outputs.length === 0 && tool.error) {
        toolMsg += `Tool: ${tool.readableName}\n${tool.error}\n`
        return
      }

      outputs.forEach((out) => {
        if (out.text) {
          toolOutput += `Tool: ${tool.readableName}\nOutput: ${out.text}\n`
        } else if (out.imageUrls) {
          toolOutput += `Tool: ${tool.readableName}\nOutput: Images were generated by this tool call and the generated image(s) is/are provided below`
          ;(latestUserMessage.content as Content[]).push(
            ...out.imageUrls.map((imageUrl) => ({
              type: 'tool_image_url' as MessageType,
              image_url: { url: imageUrl },
            })),
          )
        } else if (out.data) {
          toolOutput += `Tool: ${tool.readableName}\nOutput: ${JSON.stringify(out.data)}\n`
        }
      })
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
  const lastMessageContent =
    conversation.messages?.[conversation.messages.length - 1]?.content

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

    // const stuffedPrompt =
    //   contextText + '\n\nNow please respond to my query: ' + searchQuery
    // const totalNumTokens = encoding.encode(stuffedPrompt).length
    // console.log('contextText', contextText)
    // console.log(
    // `Total number of tokens: ${totalNumTokens}. Number of docs: ${contexts.length}, number of valid docs: ${validDocs.length}`,
    // )

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

  // Add math notation instructions
  systemPrompt += `\nWhen responding with equations, use MathJax/KaTeX notation. Equations should be wrapped in either:\n\n  * Single dollar signs $...$ for inline math\n  * Double dollar signs $$...$$ for display/block math\n  * Or \\[...\\] for display math\n  \n  Here's how the equations should be formatted in the markdown: Schrödinger Equation: $i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$`
  return systemPrompt
}