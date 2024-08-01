import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { traceable } from 'langsmith/traceable'
import { wrapOpenAI } from 'langsmith/wrappers'
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources/chat'

import { Conversation, Message } from '~/types/chat'
import { decrypt, isEncrypted } from '~/utils/crypto'

export const runtime = 'edge'

const conversationToMessages = (
  inputData: Conversation,
): ChatCompletionMessageParam[] => {
  const transformedData: ChatCompletionMessageParam[] = []

  inputData.messages.forEach((message) => {
    const simpleMessage: ChatCompletionMessageParam = {
      role: message.role,
      content: Array.isArray(message.content)
        ? message.content[0]?.text ?? ''
        : message.content,
    }
    transformedData.push(simpleMessage)
  })

  // console.log('Transformed messages array: ', transformedData)

  return transformedData
}

export async function POST(req: Request) {
  const {
    conversation,
    tools,
    openaiKey,
    imageUrls,
    imageDescription,
  }: {
    tools: ChatCompletionTool[]
    conversation: Conversation
    imageUrls: string[]
    imageDescription: string
    openaiKey: string
  } = await req.json()

  let decryptedKey = openaiKey
  if (openaiKey && isEncrypted(openaiKey)) {
    // Decrypt the key
    const decryptedText = await decrypt(
      openaiKey,
      process.env.NEXT_PUBLIC_SIGNING_KEY as string,
    )
    decryptedKey = decryptedText as string
    // console.log('models.ts Decrypted api key: ', apiKey)
  }

  if (decryptedKey && !decryptedKey.startsWith('sk-')) {
    // console.log('api key: ', decryptedKey)
    // console.log('process.env.VLADS_OPENAI_KEY: ', process.env.VLADS_OPENAI_KEY)
    decryptedKey = process.env.VLADS_OPENAI_KEY as string
  }

  // Create an OpenAI API client (that's edge friendly!)
  // const openai = new OpenAI({ apiKey: decryptedKey })

  // Cloudflare proxy format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug}/openai
  // const openai = new OpenAI({ apiKey: decryptedKey, baseURL: "https://gateway.ai.cloudflare.com/v1/74022ae0779bc80e94e2346e1720449d/uiucchat/openai" })

  // Auto-trace LLM calls w/ langsmith
  const openai = wrapOpenAI(new OpenAI({ apiKey: decryptedKey }), {
    project_name: 'uiuc-chat-production',
    metadata: {
      user_email: conversation.user_email,
      conversation_id: conversation.id,
    },
    name: 'tool-routing',
  })

  // format into OpenAI message format
  const message_to_send: ChatCompletionMessageParam[] =
    conversationToMessages(conversation)

  // Add system message
  const globalToolsSytemPromptPrefix =
    "Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is ambiguous. If you have ideas for suitable defaults, suggest that as an option to the user when asking for clarification.\n"
  message_to_send.unshift({
    role: 'system',
    content: globalToolsSytemPromptPrefix + conversation.prompt,
  })

  // MAKE USE OF IMAGE DESCRIPTION AND IMAGE URLS when selecting tools.
  if (imageUrls.length > 0 && imageDescription) {
    const imageInfo = `Image URL(s): ${imageUrls.join(', ')};\nImage Description: ${imageDescription}`
    if (message_to_send.length > 0) {
      const lastMessage = message_to_send[message_to_send.length - 1]
      if (lastMessage) {
        // Ensure the last message is defined
        lastMessage.content += `\n\n${imageInfo}`
      }
    } else {
      // If there are no messages, add a new one with the image information
      message_to_send.push({
        role: 'system',
        content: imageInfo,
      })
    }
  }

  // console.log('Message to send: ', message_to_send)
  // console.log('Tools to be used: ', tools)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // hard code function calling model
    messages: message_to_send,
    tools: tools,
    stream: false,
  })

  if (!response.choices) {
    console.error('❌ ERROR --- No response from OpenAI!!')
    return new Response('No response from OpenAI', { status: 500 })
  } else if (!response.choices[0]?.message.tool_calls) {
    return new Response('No tools invoked by OpenAI', { status: 204 })
  } else {
    const tools = response.choices[0]?.message
      .tool_calls as ChatCompletionMessageToolCall[]

    // Response format, it's an array.
    // "tool_calls": [
    //   {
    //     "id": "call_abc123",
    //     "type": "function",
    //     "function": {
    //       "name": "get_current_weather",
    //       "arguments": "{\n\"location\": \"Boston, MA\"\n}"
    //     }
    //   }
    // ]

    return new Response(JSON.stringify(tools), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
