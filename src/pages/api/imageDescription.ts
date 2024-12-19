import { NextResponse } from 'next/server'
import { ChatBody, Content, ImageBody, OpenAIChatMessage } from '~/types/chat'
import { decryptKeyIfNeeded } from '~/utils/crypto'

import { OpenAIError, OpenAIStream } from '@/utils/server'



const handler = async (req: Request): Promise<NextResponse> => {
  try {
    const { conversation, llmProviders, course_name } =
      (await req.json()) as ImageBody

    // const openAIKey = await decryptKeyIfNeeded(key)

    const systemPrompt = getImageDescriptionSystemPrompt()

    const lastMessageContents =
      conversation.messages[conversation.messages.length - 1]?.content
    const contentArray: Content[] = Array.isArray(lastMessageContents)
      ? lastMessageContents
      : [
        {
          type: 'text',
          text: lastMessageContents as string,
        },
      ]

    const messages: OpenAIChatMessage[] = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemPrompt,
          },
        ],
      },
      { role: 'user', content: [...contentArray] },
    ]
    console.log('Image Description message: ', messages)

    const response = await OpenAIStream(
      conversation.model,
      systemPrompt,
      conversation.temperature,
      llmProviders,
      messages,
      false,
    )

    return new NextResponse(JSON.stringify(response))
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

export default handler

export function getImageDescriptionSystemPrompt() {
  return `"Analyze and describe the given image with relevance to the user query, focusing solely on visible elements. Detail the image by:
	- Identifying text (OCR information), objects, spatial relationships, colors, actions, annotations, and labels.
	- Utilizing specific terminology relevant to the image's domain (e.g., medical, agricultural, technological).
	- Categorizing the image and listing associated key terms.
	- Summarizing with keywords or phrases reflecting the main themes based on the user query.
	
	Emphasize primary features before detailing secondary elements. For abstract or emotional content, infer the central message. Provide synonyms for technical terms where applicable. 
	Ensure the description remains concise, precise and relevant for semantic retrieval, avoiding mention of non-present features. Don't be redundant or overly verbose as that may hurt the semantic retrieval."
	
	**Goal:** Create an accurate, focused description that enhances semantic document retrieval of the user query, using ONLY observable details in the form of keywords`
}
