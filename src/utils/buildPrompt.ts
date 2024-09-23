// import {
//   Content,
//   ContextWithMetadata,
//   Conversation,
//   Message,
//   OpenAIChatMessage,
// } from '~/types/chat'
// import { decrypt, isEncrypted } from './crypto'
// import { CourseMetadata } from '~/types/courseMetadata'
// import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
// // @ts-expect-error - no types
// import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
// import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
// import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'

// interface Prompts {
//   systemPrompt: string
//   userPrompt: string
//   convoHistory: OpenAIChatMessage[]
// }

// export const buildPrompt = async ({
//   conversation,
//   rawOpenaiKey,
//   projectName,
//   courseMetadata,
// }: {
//   conversation: Conversation
//   rawOpenaiKey: string
//   projectName: string
//   courseMetadata: CourseMetadata | undefined
// }): Promise<Prompts> => {
//   /*
//   System prompt -- defined by user. Then we add the citations instructions to it.

//   Priorities for building prompt w/ limited window:
//     1. ✅ most recent user message
//     2. ✅ image description
//     3. ✅ tool result
//     4. query_topContext
//     5. image_topContext
//     6. tool_topContext
//     7. conversation history
//   */
//   const tokenLimit = conversation.model.tokenLimit - 1500 // save space for images, OpenAI's handling, etc.
//   let remainingTokenBudget = conversation.model.tokenLimit - 1500

//   await init((imports) => WebAssembly.instantiate(wasm, imports))
//   const encoding = new Tiktoken(
//     tiktokenModel.bpe_ranks,
//     tiktokenModel.special_tokens,
//     tiktokenModel.pat_str,
//   )

//   // do these things in parallel -- await at end
//   const allPromises = []
//   allPromises.push(decryptKeyIfNeeded(rawOpenaiKey))
//   allPromises.push(_getLastUserMessage({ conversation }))
//   allPromises.push(_getLastToolResult({ conversation }))
//   allPromises.push(_getSystemPrompt({ courseMetadata, conversation }))
//   // ideally, run context search here -- parallelized. (tricky due to sending status updates homeDispatch)
//   let [openaiKey, lastUserMessage, lastToolResult, systemPrompt] =
//     await Promise.all(allPromises)

//   // SYSTEM PROMPT
//   const systemPostPrompt = getSystemPostPrompt(projectName)
//   systemPrompt = systemPrompt + '\n\n' + systemPostPrompt
//   remainingTokenBudget -= encoding.encode(systemPrompt).length

//   // USER PROMPT
//   let userPrompt = ''
//   userPrompt += lastUserMessage
//   remainingTokenBudget -= encoding.encode(lastUserMessage || '').length

//   // TOOLS
//   if (lastToolResult && remainingTokenBudget > 0) {
//     const toolMsg = `The user invoked an API (aka tool), and here's the tool response. Remember, use this (and cite it directly) when relevant: ${lastToolResult}`
//     remainingTokenBudget -= encoding.encode(toolMsg).length
//     if (remainingTokenBudget >= 0) {
//       userPrompt += toolMsg
//     }
//   }
//   // Image description + user Query (added to prompt below)
//   const userQuery = _buildUserQuery({ conversation })

//   // query_topContext
//   const query_topContext = _buildQueryTopContext({
//     conversation: conversation,
//     encoding: encoding,
//     tokenLimit:
//       remainingTokenBudget -
//       encoding.encode(
//         `\nFinally, please respond to the user's query: ${userQuery}`,
//       ).length,
//   })
//   if (query_topContext) {
//     const queryContextMsg = `Here's high quality passages from the user's documents. Use these, and cite them carefully in the format previously described, to construct your answer: ${query_topContext}`
//     remainingTokenBudget -= encoding.encode(queryContextMsg).length
//     userPrompt += queryContextMsg
//   }

//   // add conversation history
//   const convoHistory = _buildConvoHistory({
//     conversation,
//     encoding,
//     tokenLimit: remainingTokenBudget,
//   })

//   userPrompt += `\nFinally, please respond to the user's query: ${userQuery}`

//   encoding.free() // keep this
//   return { systemPrompt: systemPrompt as string, userPrompt, convoHistory }
// }

// const _buildUserQuery = ({
//   conversation,
// }: {
//   conversation: Conversation
// }): string => {
//   // ! PROMPT STUFFING
//   let userQuery: string
//   let latestUserMessage = conversation.messages[
//     conversation.messages.length - 1
//   ]?.content as Content[]

//   if (typeof latestUserMessage === 'string') {
//     userQuery = latestUserMessage as string
//   } else {
//     // Extract image description...
//     // Change the content type for 'tool_image_url' to 'image_url'
//     // This is very important to differentiate the tool generated images from user uploaded images. Otherwise "regenerate" behavior will treat tool-result images as user images.
//     latestUserMessage.forEach((content) => {
//       if (content.type === 'tool_image_url') {
//         console.debug(
//           'Changing tool_image_url to image_url for message',
//           content,
//         )
//         content.type = 'image_url'
//       }
//     })
//     // Combine all text content into one string (like image descriptions)
//     userQuery = latestUserMessage.map((c) => c.text || '').join('\n')
//   }
//   console.log('Built userQuery: ', userQuery)
//   return userQuery
// }
// const _buildConvoHistory = ({
//   conversation,
//   tokenLimit,
//   encoding,
// }: {
//   conversation: Conversation
//   tokenLimit: number
//   encoding: Tiktoken
// }): OpenAIChatMessage[] => {
//   let tokenCount = 0
//   let messagesToSend: OpenAIChatMessage[] = []
//   const messages = conversation.messages

//   for (let i = messages.length - 1; i >= 0; i--) {
//     const message = messages[i]
//     if (message) {
//       let content: string
//       if (typeof message.content === 'string') {
//         content = message.content
//       } else {
//         // image descriptions
//         content = message.content.map((c) => c.text || '').join(' ')
//       }
//       const tokens = encoding.encode(content)

//       if (tokenCount + tokens.length + 1000 > tokenLimit) {
//         break
//       }
//       tokenCount += tokens.length
//       messagesToSend = [
//         { role: message.role, content: message.content as Content[] },
//         ...messagesToSend,
//       ]
//     }
//   }
//   return messagesToSend
// }

// export function _buildQueryTopContext({
//   conversation,
//   encoding,
//   tokenLimit = 8000,
// }: {
//   conversation: Conversation
//   encoding: Tiktoken
//   tokenLimit: number
// }) {
//   try {
//     let contexts = conversation.messages[conversation.messages.length - 1]
//       ?.contexts as ContextWithMetadata[]

//     if (contexts.length === 0) {
//       return undefined
//     }

//     let tokenCounter = 0 // encoding.encode(system_prompt + searchQuery).length
//     const validDocs = []
//     for (const [index, d] of contexts.entries()) {
//       const docString = `---\n${index + 1}: ${d.readable_filename}${
//         d.pagenumber ? ', page: ' + d.pagenumber : ''
//       }\n${d.text}\n`
//       const numTokens = encoding.encode(docString).length
//       console.log(
//         `token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`,
//       )
//       if (tokenCounter + numTokens <= tokenLimit) {
//         tokenCounter += numTokens
//         validDocs.push({ index, d })
//       } else {
//         continue
//       }
//     }

//     const separator = '---\n' // between each context
//     const contextText = validDocs
//       .map(
//         ({ index, d }) =>
//           `${index + 1}: ${d.readable_filename}${
//             d.pagenumber ? ', page: ' + d.pagenumber : ''
//           }\n${d.text}\n`,
//       )
//       .join(separator)

//     // const stuffedPrompt =
//     //   contextText + '\n\nNow please respond to my query: ' + searchQuery
//     // const totalNumTokens = encoding.encode(stuffedPrompt).length
//     console.log('contextText', contextText)
//     // console.log(
//     // `Total number of tokens: ${totalNumTokens}. Number of docs: ${contexts.length}, number of valid docs: ${validDocs.length}`,
//     // )

//     return contextText
//   } catch (e) {
//     console.error(`Error in getStuffedPrompt: ${e}`)
//     throw e
//   }
// }

// const _getSystemPrompt = async ({
//   courseMetadata,
//   conversation,
// }: {
//   courseMetadata: CourseMetadata | undefined
//   conversation: Conversation
// }): Promise<string> => {
//   let systemPrompt
//   if (courseMetadata) {
//     systemPrompt =
//       courseMetadata.system_prompt ||
//       (process.env.DEFAULT_SYSTEM_PROMPT as string)
//   } else {
//     systemPrompt = await getCourseMetadata(conversation.name).then(
//       (courseMetadata) => {
//         return (
//           courseMetadata?.system_prompt ||
//           (process.env.DEFAULT_SYSTEM_PROMPT as string)
//         )
//       },
//     )
//   }
//   return systemPrompt
// }
// const _getLastToolResult = async ({
//   conversation,
// }: {
//   conversation: Conversation
// }): Promise<string | undefined> => {
//   const toolResults = conversation.messages?.[
//     conversation.messages.length - 1
//   ]?.tools?.map((tool) => {
//     return `Tool: ${tool.tool?.name}\nOutput: ${tool.toolResult}`
//   })
//   if (toolResults) {
//     return toolResults.join('\n')
//   } else {
//     return undefined
//   }
// }
// const _getLastUserMessage = async ({
//   conversation,
// }: {
//   conversation: Conversation
// }): Promise<string> => {
//   /*
//     Gets either/or user message and/or image descriptions.
//   */

//   let most_recent_user_message = ''
//   const lastMessageContent =
//     conversation.messages?.[conversation.messages.length - 1]?.content
//   if (typeof lastMessageContent === 'string') {
//     most_recent_user_message = lastMessageContent
//   } else if (Array.isArray(lastMessageContent)) {
//     most_recent_user_message = lastMessageContent
//       .map((content) => content.text || '')
//       .join('\n')
//   }
//   return most_recent_user_message
// }

// const decryptKeyIfNeeded = async (openaiKey: string) => {
//   if (openaiKey && isEncrypted(openaiKey)) {
//     const decryptedText = await decrypt(
//       openaiKey,
//       process.env.NEXT_PUBLIC_SIGNING_KEY as string,
//     )
//     openaiKey = decryptedText as string
//   } else {
//     // console.log('Using client key for openai chat: ', apiKey)
//   }
//   return openaiKey
// }

// export function getSystemPostPrompt(course_name: string) {
//   /*
//   This goes AFTER the user-defined system message. It's mostly about citations and response format styling.
//   */
//   let prePrompt = `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be pdf files or web pages. Additionally, you may see the output from API calls (calld 'tools') to the user's services which, when relevant, you should use to construct your answer. You may also see image descriptions from images uploaded by the user. Prioritize image descriptions, when helpful, to construct your answer.
// Integrate relevant information from these documents, ensuring each reference is linked to the document's number.
// Your response should be semi-formal.
// When quoting directly, cite with footnotes linked to the document number and page number, if provided.
// Summarize or paraphrase other relevant information with inline citations, again referencing the document number and page number, if provided.
// If the answer is not in the provided documents, state so. Yet always provide as helpful a response as possible to directly answer the question.
// Conclude your response with a LIST of the document titles as clickable placeholders, each linked to its respective document number and page number, if provided.
// Always share page numbers if they were shared with you.
// ALWAYS follow the examples below:
// Insert an inline citation like this in your response:
// "[1]" if you're referencing the first document or
// "[1, page: 2]" if you're referencing page 2 of the first document.
// At the end of your response, list the document title with a clickable link, like this:
// "1. [document_name](#)" if you're referencing the first document or
// "1. [document_name, page: 2](#)" if you're referencing page 2 of the first document.
// Nothing else should prefixxed or suffixed to the citation or document name. Consecutive citations should be separated by a comma.

// Suppose a document name is shared with you along with the index and pageNumber below like "27: www.pdf, page: 2", "28: www.osd", "29: pdf.www, page 11\n15" where 27, 28, 29 are indices, www.pdf, www.osd, pdf.www are document_name, and 2, 11 are the pageNumbers and 15 is the content of the document, then inline citations and final list of cited documents should ALWAYS be in the following format:
// """
// The sky is blue. [27, page: 2][28] The grass is green. [29, page: 11]
// Relevant Sources:

// 27. [www.pdf, page: 2](#)
// 28. [www.osd](#)
// 29. [pdf.www, page: 11](#)
// """
// ONLY return the documents with relevant information and cited in the response. If there are no relevant sources, don't include the "Relevant Sources" section in response.
// The following are excerpts from the high-quality documents, APIs/tools, and image descriptions to construct your answer.\n`

//   // Law school "closed world" question answering
//   if (course_name == 'Law794-TransactionalDraftingAlam') {
//     const lawPreprompt =
//       'This is for the law domain and we train law students to stick to facts that are in the record. Do not improvise or use your world knowledge, stick to only the information provided and make heavy use of direct quotes instead of paraphrasing or summarizing.\n'
//     prePrompt = lawPreprompt + prePrompt
//   }

//   return prePrompt
// }
