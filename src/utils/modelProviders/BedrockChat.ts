import { ChatBody, Message } from '@/types/chat'
import { OpenAIError } from '@/utils/server'
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

export const maxDuration = 60

export const bedrockChat = async (
  chatBody: ChatBody,
  stream: boolean,
): Promise<any> => {
  try {
    const { conversation, llmProviders } = chatBody

    if (!conversation) {
      throw new Error(
        'No conversation provided. It seems the `messages` array was empty.',
      )
    }

    const messagesToSend = convertConversationToBedrockMessages(
      conversation.messages,
    )

    // Get the latest system message
    const latestSystemMessage =
      conversation.messages[conversation.messages.length - 1]
        ?.latestSystemMessage

    if (!latestSystemMessage) {
      throw new Error('No system message found in the conversation.')
    }

    const model = typeof conversation.model === 'string' ? conversation.model : conversation.model?.id;

    // Here you would implement the Bedrock streaming or non-streaming call
    // This is a placeholder for the actual Bedrock API call
    const apiStream = await BedrockStream(
      model,
      latestSystemMessage,
      conversation.temperature,
      llmProviders!,
      messagesToSend,
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

const convertConversationToBedrockMessages = (
  messages: Message[],
): Message[] => {
  return messages.map((message, messageIndex) => {
    const strippedMessage = { ...message }
    
    // Handle array content
    if (Array.isArray(strippedMessage.content)) {
      strippedMessage.content = strippedMessage.content.map((content) => {
        // Convert image formats if needed
        if (content.type === 'tool_image_url') {
          return {
            type: 'tool_image_url',
            image_url: content.image_url
          }
        }
        
        // Handle final message
        if (
          content.type === 'text' &&
          messageIndex === messages.length - 1 &&
          !content.text?.startsWith('Image description:')
        ) {
          return {
            type: 'text',
            text: strippedMessage.finalPromtEngineeredMessage
          }
        }
        
        return content
      })
    } else {
      // Handle string content
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

    // Remove unnecessary fields
    delete strippedMessage.finalPromtEngineeredMessage
    delete strippedMessage.latestSystemMessage
    delete strippedMessage.contexts
    delete strippedMessage.tools
    delete strippedMessage.feedback

    return strippedMessage
  })
}

async function BedrockStream(
  model: string,
  systemMessage: string,
  temperature: number,
  llmProviders: any,
  messages: Message[],
  stream: boolean,
) {
  const bedrockClient = new BedrockRuntimeClient({
    region: llmProviders.bedrock.region,
    credentials: {
      accessKeyId: llmProviders.bedrock.accessKeyId,
      secretAccessKey: llmProviders.bedrock.secretAccessKey,
    },
  });

  // Format messages for Bedrock
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: Array.isArray(msg.content) 
      ? msg.content.map(c => c.text).join('\n')
      : msg.content
  }));

  // Add system message if not present
  if (!formattedMessages.find(m => m.role === 'system')) {
    formattedMessages.unshift({ role: 'system', content: systemMessage });
  }

  // Prepare the request body based on model type
  const requestBody = model.includes('anthropic') ? {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    temperature: temperature,
    messages: formattedMessages,
  } : {
    messages: formattedMessages,
    temperature: temperature,
    max_tokens: 4096,
  };

  if (stream) {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    // Create a TransformStream to process the chunks
    const transformStream = new TransformStream({
      transform(chunk: Uint8Array, controller) {
        try {
          const decoded = new TextDecoder().decode(chunk);
          const parsed = JSON.parse(decoded);
          
          if (parsed.completion) {
            controller.enqueue(
              `data: ${JSON.stringify({
                choices: [{
                  delta: {
                    content: parsed.completion,
                  },
                }],
              })}\n\n`
            );
          }
        } catch (e) {
          console.error('Error processing stream chunk:', e);
        }
      },
      flush(controller) {
        controller.enqueue('data: [DONE]\n\n');
      },
    });

    // Create a ReadableStream from the AsyncIterable
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          if (!response.body) {
            throw new Error('No response body from Bedrock');
          }
          
          for await (const chunk of response.body) {
            if (chunk instanceof Uint8Array) {
              controller.enqueue(chunk);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return readableStream.pipeThrough(transformStream);
  } else {
    // Non-streaming response
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    let fullResponse = '';

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    // Collect all chunks
    for await (const chunk of response.body) {
      if (chunk instanceof Uint8Array) {
        const decoded = new TextDecoder().decode(chunk);
        const parsed = JSON.parse(decoded);
        if (parsed.completion) {
          fullResponse += parsed.completion;
        }
      }
    }

    return {
      choices: [{
        message: {
          content: fullResponse,
          role: 'assistant'
        }
      }]
    };
  }
} 