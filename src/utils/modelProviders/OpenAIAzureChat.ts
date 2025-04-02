import { OpenAIError, OpenAIStream } from '@/utils/server'
import { ChatBody, Message } from '@/types/chat'


export const openAIAzureChat = async (
  chatBody: ChatBody,
  stream: boolean,
): Promise<any> => {
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

    // Log the exact messages being sent to OpenAI
    console.log('============= OPENAI/AZURE CHAT FULL REQUEST PAYLOAD =============');
    console.log(JSON.stringify({
      model: conversation.model.id,
      messages: messagesToSend,
      temperature: conversation.temperature,
      stream: stream,
      imageContent: messagesToSend
        .flatMap(msg => Array.isArray(msg.content) ? 
          msg.content.filter(content => content.type === 'image_url') : 
          []
        )
    }, null, 2));
    console.log('===================================================================');

    // Log specific image content if it exists
    const hasImageContent = messagesToSend.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(content => content.type === 'image_url')
    );
    
    if (hasImageContent) {
      console.log('============= IMAGE CONTENT DETAIL IN MESSAGES =============');
      messagesToSend.forEach((msg, i) => {
        if (Array.isArray(msg.content)) {
          const imageContents = msg.content.filter(content => content.type === 'image_url');
          if (imageContents.length > 0) {
            console.log(`Message ${i} (${msg.role}) contains ${imageContents.length} images:`);
            console.log(JSON.stringify(imageContents, null, 2));
          }
        }
      });
      console.log('===========================================================');
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
      // For non-streaming responses, return apiStream directly since it already has the correct structure
      return new Response(JSON.stringify(apiStream), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
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
  // Log original messages before transformation
  console.log('============= MESSAGES BEFORE TRANSFORMATION =============');
  console.log(JSON.stringify(messages.map(msg => ({
    role: msg.role,
    contentType: Array.isArray(msg.content) ? 'array' : typeof msg.content,
    imageCount: Array.isArray(msg.content) 
      ? msg.content.filter(c => c.type === 'image_url' || c.type === 'tool_image_url').length 
      : 0,
    hasTools: !!msg.tools && msg.tools.length > 0,
    hasFinalPrompt: !!msg.finalPromtEngineeredMessage
  })), null, 2));
  
  const transformedMessages = messages.map((message, messageIndex) => {
    const strippedMessage = { ...message }
    // When content is an array
    if (Array.isArray(strippedMessage.content)) {
      // Log details about image URLs in this message
      const originalImageContent = strippedMessage.content
        .filter(c => c.type === 'image_url' || c.type === 'tool_image_url');
      
      if (originalImageContent.length > 0) {
        console.log(`Original message ${messageIndex} (${message.role}) contains images:`);
        console.log(JSON.stringify(originalImageContent, null, 2));
      }
      
      strippedMessage.content.map((content, contentIndex) => {
        // Convert tool_image_url to image_url for OpenAI
        if (content.type === 'tool_image_url') {
          console.log(`Converting tool_image_url to image_url in message ${messageIndex}, content ${contentIndex}`);
          console.log(`Original: ${JSON.stringify(content)}`);
          content.type = 'image_url'
          console.log(`Converted: ${JSON.stringify(content)}`);
        }
        // Add final prompt to last message
        if (
          content.type === 'text' &&
          messageIndex === messages.length - 1 &&
          !content.text?.startsWith('Image description:')
        ) {
          // console.debug('Replacing the text: ', content.text)
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
  
  // Log transformed messages
  console.log('============= MESSAGES AFTER TRANSFORMATION =============');
  console.log(JSON.stringify(transformedMessages.map(msg => ({
    role: msg.role,
    contentType: Array.isArray(msg.content) ? 'array' : typeof msg.content,
    imageCount: Array.isArray(msg.content) 
      ? msg.content.filter(c => c.type === 'image_url').length 
      : 0,
    sampleContent: Array.isArray(msg.content) 
      ? msg.content.slice(0, 2).map(c => ({ type: c.type }))
      : null
  })), null, 2));
  
  // Add detailed log of any message containing images - show complete structure
  const messagesWithImages = transformedMessages.filter(msg => 
    Array.isArray(msg.content) && 
    msg.content.some(c => c.type === 'image_url')
  );
  
  if (messagesWithImages.length > 0) {
    console.log('============= COMPLETE IMAGE-CONTAINING MESSAGES =============');
    console.log(JSON.stringify(messagesWithImages, null, 2));
    console.log('==============================================================');
  }
  
  return transformedMessages
}
