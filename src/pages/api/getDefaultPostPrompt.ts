import { NextApiRequest, NextApiResponse } from 'next'
import { getDefaultPostPrompt } from '~/pages/api/chat'
import { Conversation } from '~/types/chat'
import { CourseMetadata } from '~/types/courseMetadata'
import { AnySupportedModel } from '~/utils/modelProviders/LLMProvider'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const defaultPrompt = getDefaultPostPrompt()
    console.log('defaultPrompt:', defaultPrompt)
    res.status(200).json({ prompt: defaultPrompt })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// const _getDefaultPostPrompt = (): string => {
//   // The default values for courseMetadata
//   const defaultCourseMetadata: CourseMetadata = {
//     is_private: false,
//     course_owner: '',
//     course_admins: [],
//     approved_emails_list: [],
//     example_questions: undefined,
//     banner_image_s3: undefined,
//     course_intro_message: undefined,
//     system_prompt: undefined,
//     openai_api_key: undefined, // TODO: remove
//     disabled_models: undefined, // TODO: remove
//     project_description: undefined,
//     documentsOnly: false,
//     guidedLearning: false,
//     systemPromptOnly: false,
//   }

//   // Call getSystemPostPrompt with default values
//   return _getSystemPostPrompt({
//     conversation: {
//       id: '',
//       name: '',
//       messages: [],
//       model: {} as AnySupportedModel,
//       prompt: '',
//       temperature: 0.7,
//       folderId: null,
//     } as Conversation,
//     courseMetadata: defaultCourseMetadata,
//   })
// }

// const _getSystemPostPrompt = ({
//   conversation,
//   courseMetadata,
// }: {
//   conversation: Conversation
//   courseMetadata: CourseMetadata
// }): string => {
//   console.log('At the top of getSystemPostPrompt')
//   const { guidedLearning, systemPromptOnly, documentsOnly } = courseMetadata
//   console.log('At the top of getSystemPostPrompt')
//   console.log('Inputs:', { guidedLearning, systemPromptOnly, documentsOnly })

//   // If systemPromptOnly is true, return an empty PostPrompt
//   if (systemPromptOnly) {
//     return ''
//   }

//   // Initialize PostPrompt as an array of strings for easy manipulation
//   const PostPromptLines: string[] = []

//   // The main system prompt
//   PostPromptLines.push(
//     `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be pdf files or web pages. Additionally, you may see the output from API calls (called 'tools') to the user's services which, when relevant, you should use to construct your answer. You may also see image descriptions from images uploaded by the user. Prioritize image descriptions, when helpful, to construct your answer.
// Integrate relevant information from these documents, ensuring each reference is linked to the document's number.
// Your response should be semi-formal. 
// When quoting directly, cite with footnotes linked to the document number and page number, if provided. 
// Summarize or paraphrase other relevant information with inline citations, again referencing the document number and page number, if provided.
// If the answer is not in the provided documents, state so.${
//       guidedLearning || documentsOnly
//         ? ''
//         : ' Yet always provide as helpful a response as possible to directly answer the question.'
//     }
// Conclude your response with a LIST of the document titles as clickable placeholders, each linked to its respective document number and page number, if provided.
// Always share page numbers if they were shared with you.
// ALWAYS follow the examples below:
// Insert an inline citation like this in your response: 
// "[1]" if you're referencing the first document or 
// "[1, page: 2]" if you're referencing page 2 of the first document.
// At the end of your response, list the document title with a clickable link, like this: 
// "1. [document_name](#)" if you're referencing the first document or
// "1. [document_name, page: 2](#)" if you're referencing page 2 of the first document.
// Nothing else should prefix or suffix the citation or document name. 

// Consecutive inline citations are ALWAYS discouraged. Use a maximum of 3 citations. Follow this exact formatting: separate citations with a comma like this: "[1, page: 2], [2, page: 3]" or like this "[1], [2], [3]".

// Suppose a document name is shared with you along with the index and pageNumber below like "27: www.pdf, page: 2", "28: www.osd", "29: pdf.www, page 11\n15" where 27, 28, 29 are indices, www.pdf, www.osd, pdf.www are document_name, and 2, 11 are the pageNumbers and 15 is the content of the document, then inline citations and final list of cited documents should ALWAYS be in the following format:
// """
// The sky is blue. [27, page: 2][28] The grass is green. [29, page: 11]
// Relevant Sources:

// 27. [www.pdf, page: 2](#)
// 28. [www.osd](#)
// 29. [pdf.www, page: 11](#)
// """
// ONLY return the documents with relevant information and cited in the response. If there are no relevant sources, don't include the "Relevant Sources" section in response.
// The user message will include excerpts from the high-quality documents, APIs/tools, and image descriptions to construct your answer. Each will be labeled with XML-style tags, like <Potentially Relevant Documents> and <Tool Outputs>. Make use of that information when writing your response.`,
//   )

//   // Combine the lines to form the PostPrompt
//   const PostPrompt = PostPromptLines.join('\n')

//   console.log('PostPrompt:', PostPrompt)

//   return PostPrompt
// }
