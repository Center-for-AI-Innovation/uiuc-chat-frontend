import { initializeEncoding } from '@/utils/encoding'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import { ChatBody, Message } from '@/types/chat'
import { NextApiRequest, NextApiResponse } from 'next'

export const maxDuration = 60

export const openAIAzureChat = async (chatBody: ChatBody, stream: boolean) => {
  // OpenAI's main chat endpoint
  try {
    const { conversation, llmProviders } = chatBody

    if (!conversation) {
      throw new Error(
        'No conversation provided. It seems the `messages` array was empty.',
      )
    }

    const messagesToSend = convertConversationToOpenAIMessages(
      conversation.messages,
    )

    // Get the latest system message
    const latestSystemMessage =
      conversation.messages[conversation.messages.length - 1]
        ?.latestSystemMessage

    if (!latestSystemMessage) {
      throw new Error('No system message found in the conversation.')
    }

    const apiStream = await OpenAIStream(
      conversation.model,
      latestSystemMessage,
      conversation.temperature,
      llmProviders!,
      // @ts-ignore -- I think the types are fine.
      messagesToSend, //old: conversation.messages
      stream,
    )

    if (stream) {
      if (apiStream instanceof ReadableStream) {
        return new Response(apiStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }
      return apiStream
    } else {
      // For non-streaming responses, ensure we're returning a properly formatted response
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: apiStream,
              },
            },
          ],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      // return JSON.stringify(apiStream)
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error
    } else {
      throw new OpenAIError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while processing your request',
        'unexpected_error',
        undefined,
        error instanceof Error ? error.message : undefined,
      )
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
    delete strippedMessage.feedback
    return strippedMessage
  })
}
