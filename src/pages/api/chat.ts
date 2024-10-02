// src/pages/api/chat.ts
import { CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import {
  ChatBody,
  Content,
  ContextWithMetadata,
  Conversation,
  Message,
  MessageType,
  OpenAIChatMessage,
  ToolOutput,
  UIUCTool,
} from '@/types/chat'
import { NextResponse } from 'next/server'
import { decryptKeyIfNeeded } from '~/utils/crypto'
import {
  ProviderNames,
  AnySupportedModel,
} from '~/utils/modelProviders/LLMProvider'
import { AzureModels } from '~/utils/modelProviders/azure'
import { OpenAIModels } from '~/utils/modelProviders/types/openai'
import OpenAI from 'openai'

export const config = {
  runtime: 'edge',
}
export const maxDuration = 60

const handler = async (req: Request): Promise<NextResponse> => {
  try {
    const {
      conversation,
      key,
      course_name,
      courseMetadata,
      stream,
      llmProviders,
    } = (await req.json()) as ChatBody

    if (!conversation) {
      console.error(
        'No conversation provided. It seems the `messages` array was empty.',
      )
      return new NextResponse(
        JSON.stringify({
          error:
            'No conversation provided. It seems the `messages` array was empty.',
        }),
        { status: 400 },
      )
    }

    // const messagesToSend = [latestMessage, ...convoHistory] // BUG: REPLACE (not append to) latest user message. RN we have dupliacates.
    // Strip internal messages to send to OpenAI
    // console.log('Messages to send before refactor:', conversation.messages)
    const messagesToSend = convertConversationToOpenAIMessages(
      conversation.messages,
    )
    // console.log('Messages to send: ', messagesToSend)

    console.log(
      'System prompt: ',
      conversation.messages[conversation.messages.length - 1]!
        .latestSystemMessage,
    )

    const apiStream = await OpenAIStream(
      conversation.model,
      conversation.messages[conversation.messages.length - 1]!
        .latestSystemMessage!,
      conversation.temperature,
      llmProviders!,
      // openAIKey,
      // @ts-ignore -- I think the types are fine.
      messagesToSend, //old: conversation.messages
      stream,
    )
    if (stream) {
      return new NextResponse(apiStream)
    } else {
      return new NextResponse(JSON.stringify(apiStream))
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      const { name, message } = error
      console.error('OpenAI Completion Error', message)
      const resp = NextResponse.json(
        {
          statusCode: 400,
          name: name,
          message: message,
        },
        { status: 400 },
      )
      console.log('Final OpenAIError resp: ', resp)
      return resp
    } else {
      console.error('Unexpected Error', error)
      const resp = NextResponse.json({ name: 'Error' }, { status: 500 })
      console.log('Final Error resp: ', resp)
      return resp
    }
  }
}

const convertConversationToOpenAIMessages = (
  messages: Message[],
): Message[] => {
  return messages.map((message, messageIndex) => {
    const strippedMessage = { ...message }
    // When content is an array
    if (Array.isArray(strippedMessage.content)) {
      strippedMessage.content.map((content, contentIndex) => {
        // Convert tool_image_url to image_url for OpenAI
        if (content.type === 'tool_image_url') {
          content.type = 'image_url'
        }
        // Add final prompt to last message
        if (
          content.type === 'text' &&
          messageIndex === messages.length - 1 &&
          !content.text?.startsWith('Image description:')
        ) {
          console.debug('Replacing the text: ', content.text)
          content.text = strippedMessage.finalPromtEngineeredMessage
        }
        return content
      })
    } else {
      // When content is a string
      // Add final prompt to last message
      if (messageIndex === messages.length - 1) {
        if (strippedMessage.role === 'user') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.finalPromtEngineeredMessage,
            },
          ]
          // Add system prompt to message with role system
        } else if (strippedMessage.role === 'system') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.latestSystemMessage,
            },
          ]
        }
      }
    }
    delete strippedMessage.finalPromtEngineeredMessage
    delete strippedMessage.latestSystemMessage
    delete strippedMessage.contexts
    delete strippedMessage.tools
    return strippedMessage
  })
}

export default handler

interface Prompts {
  systemPrompt: string
  userPrompt: string
  convoHistory: OpenAIChatMessage[]
  openAIKey: string
}

export const buildPrompt = async ({
  conversation,
  projectName,
  courseMetadata,
}: {
  conversation: Conversation
  projectName: string
  courseMetadata: CourseMetadata | undefined
}): Promise<Conversation> => {
  /*
  System prompt -- defined by user. If documents are provided, add the citations instructions to it.

  Priorities for building prompt w/ limited window: 
  1. ✅ most recent user text input & images/img-description (depending on model support for images)
  1.5. ❌ Last 1 or 2 convo history. At least the user message and the AI response. Key for follow-up questions.
  2. ✅ image description
  3. ✅ tool result
  4. ✅ query_topContext (if documents are retrieved)
  5. image_topContext
  6. tool_topContext
  7. ✅ conversation history
  */
  let remainingTokenBudget = conversation.model.tokenLimit - 1500 // save space for images, OpenAI's handling, etc.

  await init((imports) => WebAssembly.instantiate(wasm, imports))
  const encoding = new Tiktoken(
    tiktokenModel.bpe_ranks,
    tiktokenModel.special_tokens,
    tiktokenModel.pat_str,
  )

  try {
    // Do these things in parallel -- await at the end
    const allPromises = []
    allPromises.push(_getLastUserTextInput({ conversation }))
    allPromises.push(_getLastToolResult({ conversation }))
    allPromises.push(_getSystemPrompt({ courseMetadata, conversation }))
    const [lastUserTextInput, lastToolResult, finalSystemPrompt] =
      (await Promise.all(allPromises)) as [string, UIUCTool[], string]

    console.log('LATEST USER Text Input: ', lastUserTextInput)

    // Adjust remaining token budget
    try {
      remainingTokenBudget -= encoding.encode(finalSystemPrompt).length
    } catch (encodeError) {
      console.error('Error during encoding of finalSystemPrompt:', encodeError)
      console.log(
        'String being encoded (finalSystemPrompt):',
        finalSystemPrompt,
      )
    }

    // --------- <USER PROMPT> ----------
    let userPrompt = ''

    // P1: Most recent user text input
    const userQuery = `\nFinally, please respond to the user's query to the best of your ability:\n<User Query>\n${lastUserTextInput}\n</User Query>`
    try {
      remainingTokenBudget -= encoding.encode(userQuery).length
    } catch (encodeError) {
      console.error('Error during encoding of userQuery:', encodeError)
      console.log('String being encoded (userQuery):', userQuery)
    }

    // P2: Latest 2 conversation messages (Reserved tokens)
    const tokensInLastTwoMessages = _getRecentConvoTokens({
      conversation,
      encoding,
    })
    console.log('Tokens in last two messages: ', tokensInLastTwoMessages)
    remainingTokenBudget -= tokensInLastTwoMessages

    // Get contexts
    const contexts =
      (conversation.messages[conversation.messages.length - 1]
        ?.contexts as ContextWithMetadata[]) || []

    if (contexts && contexts.length > 0) {
      // Documents are present, maintain all existing processes as normal
      // P5: query_topContext
      const query_topContext = _buildQueryTopContext({
        conversation: conversation,
        encoding: encoding,
        tokenLimit: remainingTokenBudget - tokensInLastTwoMessages, // Keep room for convo history
      })
      if (query_topContext) {
        const queryContextMsg = `\nHere's high quality passages from the user's documents. Use these, and cite them carefully in the format previously described, to construct your answer:\n<Potentially Relevant Documents>\n${query_topContext}\n</Potentially Relevant Documents>\n`
        try {
          remainingTokenBudget -= encoding.encode(queryContextMsg).length
        } catch (encodeError) {
          console.error(
            'Error during encoding of queryContextMsg:',
            encodeError,
          )
          console.log(
            'String being encoded (queryContextMsg):',
            queryContextMsg,
          )
        }
        userPrompt += queryContextMsg
      }
    }

    const latestUserMessage =
      conversation.messages[conversation.messages.length - 1]

    // Move Tool Outputs to be added before the userQuery
    if (latestUserMessage?.tools) {
      const toolsOutputResults = _buildToolsOutputResults({ conversation })

      // Add Tool Instructions and outputs
      const toolInstructions =
        "\n<Tool Instructions>The user query required the invocation of external tools, and now it's your job to use the tool outputs and any other information to craft a great response. All tool invocations have already been completed before you saw this message. You should not attempt to invoke any tools yourself; instead, use the provided results/outputs of the tools. If any tools errored out, inform the user. If the tool outputs are irrelevant to their query, let the user know. Use relevant tool outputs to craft your response. The user may or may not reference the tools directly, but provide a helpful response based on the available information. Never tell the user you will run tools for them, as this has already been done. Always use the past tense to refer to the tool outputs. Never request access to the tools, as you are guaranteed to have access when appropriate; for example, never say 'I would need access to the tool.' When using tool results in your answer, always specify the source, using code notation, such as '...as per tool `tool name`...' or 'According to tool `tool name`...'. Never fabricate tool results; it is crucial to be honest and transparent. Stick to the facts as presented.</Tool Instructions>"

      userPrompt += toolInstructions

      // Ensure tool outputs are counted in the token budget
      try {
        remainingTokenBudget -= encoding.encode(toolsOutputResults).length
      } catch (encodeError) {
        console.error(
          'Error during encoding of toolsOutputResults:',
          encodeError,
        )
        console.log(
          'String being encoded (toolsOutputResults):',
          toolsOutputResults,
        )
      }

      userPrompt += toolsOutputResults
    }

    // Add the user's query
    userPrompt += userQuery

    // P8: Conversation history
    const convoHistory = _buildConvoHistory({
      conversation,
      encoding,
      tokenLimit: remainingTokenBudget,
    })

    // Set final system and user prompts
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
  } finally {
    encoding.free() // Clean up the encoding
  }
}

const _getRecentConvoTokens = ({
  conversation,
  encoding,
}: {
  conversation: Conversation
  encoding: Tiktoken
}): number => {
  // TODO: This is not counting the last 2/4 messages properly. I think it only counts assistant messages, not user. Not sure.

  return conversation.messages.slice(-4).reduce((acc, message) => {
    let content: string
    if (typeof message.content === 'string') {
      content = message.content
      console.log('Message content: ', content)
    } else {
      content = ''
    }

    console.log('Encoding content: ', content, encoding.encode(content).length)
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
  encoding,
}: {
  conversation: Conversation
  tokenLimit: number
  encoding: Tiktoken
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

export function _buildQueryTopContext({
  conversation,
  encoding,
  tokenLimit = 8000,
}: {
  conversation: Conversation
  encoding: Tiktoken
  tokenLimit: number
}) {
  try {
    const contexts = conversation.messages[conversation.messages.length - 1]
      ?.contexts as ContextWithMetadata[]

    if (contexts.length === 0) {
      return undefined
    }

    let tokenCounter = 0 // encoding.encode(system_prompt + searchQuery).length
    const validDocs = []
    for (const [index, d] of contexts.entries()) {
      const docString = `---\n${index + 1}: ${d.readable_filename}${
        d.pagenumber ? ', page: ' + d.pagenumber : ''
      }\n${d.text}\n`
      const numTokens = encoding.encode(docString).length
      // console.log(
      //   `token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`,
      // )
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

const _getSystemPrompt = async ({
  courseMetadata,
  conversation,
}: {
  courseMetadata: CourseMetadata | undefined
  conversation: Conversation
}): Promise<string> => {
  let userDefinedSystemPrompt
  if (courseMetadata) {
    userDefinedSystemPrompt =
      courseMetadata.system_prompt ||
      (process.env.DEFAULT_SYSTEM_PROMPT as string)
  } else {
    userDefinedSystemPrompt = await getCourseMetadata(conversation.name).then(
      (courseMetadata) => {
        return (
          courseMetadata?.system_prompt ||
          (process.env.DEFAULT_SYSTEM_PROMPT as string)
        )
      },
    )
  }

  // Check if contexts are present
  const contexts =
    (conversation.messages[conversation.messages.length - 1]
      ?.contexts as ContextWithMetadata[]) || []

  if (!contexts || contexts.length === 0) {
    // No documents retrieved, return only user-defined system prompt
    return userDefinedSystemPrompt
  } else {
    // Documents are present, include system post prompt
    return (
      userDefinedSystemPrompt +
      '\n\n' +
      getSystemPostPrompt({ conversation, courseMetadata: courseMetadata! })
    )
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

export const getSystemPostPrompt = ({
  conversation,
  courseMetadata,
}: {
  conversation: Conversation
  courseMetadata: CourseMetadata
}): string => {
  console.log('At the top of getSystemPostPrompt')
  const { guidedLearning, systemPromptOnly, documentsOnly } = courseMetadata
  console.log('At the top of getSystemPostPrompt')
  console.log('Inputs:', { guidedLearning, systemPromptOnly, documentsOnly })

  // If systemPromptOnly is true, return an empty PostPrompt
  if (systemPromptOnly) {
    return ''
  }

  // Initialize PostPrompt as an array of strings for easy manipulation
  const PostPromptLines: string[] = []

  // The main system prompt
  PostPromptLines.push(
    `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be pdf files or web pages. Additionally, you may see the output from API calls (called 'tools') to the user's services which, when relevant, you should use to construct your answer. You may also see image descriptions from images uploaded by the user. Prioritize image descriptions, when helpful, to construct your answer.
Integrate relevant information from these documents, ensuring each reference is linked to the document's number.
Your response should be semi-formal. 
When quoting directly, cite with footnotes linked to the document number and page number, if provided. 
Summarize or paraphrase other relevant information with inline citations, again referencing the document number and page number, if provided.
If the answer is not in the provided documents, state so.${
      guidedLearning || documentsOnly
        ? ''
        : ' Yet always provide as helpful a response as possible to directly answer the question.'
    }
Conclude your response with a LIST of the document titles as clickable placeholders, each linked to its respective document number and page number, if provided.
Always share page numbers if they were shared with you.
ALWAYS follow the examples below:
Insert an inline citation like this in your response: 
"[1]" if you're referencing the first document or 
"[1, page: 2]" if you're referencing page 2 of the first document.
At the end of your response, list the document title with a clickable link, like this: 
"1. [document_name](#)" if you're referencing the first document or
"1. [document_name, page: 2](#)" if you're referencing page 2 of the first document.
Nothing else should prefix or suffix the citation or document name. 

Consecutive inline citations are ALWAYS discouraged. Use a maximum of 3 citations. Follow this exact formatting: separate citations with a comma like this: "[1, page: 2], [2, page: 3]" or like this "[1], [2], [3]".

Suppose a document name is shared with you along with the index and pageNumber below like "27: www.pdf, page: 2", "28: www.osd", "29: pdf.www, page 11\n15" where 27, 28, 29 are indices, www.pdf, www.osd, pdf.www are document_name, and 2, 11 are the pageNumbers and 15 is the content of the document, then inline citations and final list of cited documents should ALWAYS be in the following format:
"""
The sky is blue. [27, page: 2][28] The grass is green. [29, page: 11]
Relevant Sources:

27. [www.pdf, page: 2](#)
28. [www.osd](#)
29. [pdf.www, page: 11](#)
"""
ONLY return the documents with relevant information and cited in the response. If there are no relevant sources, don't include the "Relevant Sources" section in response.
The user message will include excerpts from the high-quality documents, APIs/tools, and image descriptions to construct your answer. Each will be labeled with XML-style tags, like <Potentially Relevant Documents> and <Tool Outputs>. Make use of that information when writing your response.`,
  )

  // Combine the lines to form the PostPrompt
  const PostPrompt = PostPromptLines.join('\n')

  console.log('PostPrompt:', PostPrompt)

  return PostPrompt
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
  }

  // Call getSystemPostPrompt with default values
  return getSystemPostPrompt({
    conversation: {
      id: '',
      name: '',
      messages: [],
      model: {} as AnySupportedModel,
      prompt: '',
      temperature: 0.7,
      folderId: null,
    } as Conversation,
    courseMetadata: defaultCourseMetadata,
  })
}
