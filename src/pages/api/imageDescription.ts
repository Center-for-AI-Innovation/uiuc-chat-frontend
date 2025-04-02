import { type NextApiRequest, type NextApiResponse } from 'next'
import { type ChatBody, type ImageBody, type OpenAIChatMessage, type Role } from '~/types/chat'
import { OpenAIError } from '@/utils/server'
import { v4 as uuidv4 } from 'uuid'
import { routeModelRequest } from '~/utils/streamProcessing'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { contentArray, llmProviders, model } = req.body as ImageBody

    const systemPrompt = getImageDescriptionSystemPrompt()

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

    // Log the exact message payload for image processing
    console.log('================ IMAGE DESCRIPTION REQUEST ================');
    console.log(JSON.stringify({
      model: model.id,
      messages: messages,
      temperature: 0.1,
      stream: false
    }, null, 2));
    console.log('===========================================================');

    // Create a temporary conversation object for routeModelRequest
    const conversation = {
      id: uuidv4(),
      name: 'Image Description',
      messages: [
        {
          id: uuidv4(),
          role: 'system' as Role,
          content: systemPrompt,
        },
        {
          id: uuidv4(),
          role: 'user' as Role,
          content: contentArray,
        }
      ],
      model: model,
      prompt: systemPrompt,
      temperature: 0.1,
      folderId: null,
    };

    // Create ChatBody for routeModelRequest
    const chatBody: ChatBody = {
      conversation: conversation,
      key: '',
      course_name: 'image_description',
      stream: false,
      llmProviders: llmProviders,
      mode: 'chat'
    };

    // Route to the appropriate model handler based on the selected model
    const response = await routeModelRequest(chatBody);
    
    // Process the response to ensure it has the expected format
    let formattedResponse;
    let extractedContent = '';
    
    try {
      console.log('Raw image description response type:', typeof response);
      
      // Check if response is a Response object
      if (response instanceof Response) {
        const responseData = await response.json();
        console.log('Response data from image description:', JSON.stringify(responseData, null, 2));
        
        // Try to extract content from various possible response structures
        if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
          extractedContent = responseData.choices[0].message.content;
        } else if (responseData.message) {
          extractedContent = responseData.message;
        } else if (typeof responseData === 'string') {
          extractedContent = responseData;
        } else {
          extractedContent = JSON.stringify(responseData);
        }
      } else {
        // Handle case where it's already a JSON object
        console.log('JSON response from image description:', JSON.stringify(response, null, 2));
        
        if (response.choices && response.choices[0] && response.choices[0].message) {
          extractedContent = response.choices[0].message.content;
        } else if (response.message) {
          extractedContent = response.message;
        } else if (typeof response === 'string') {
          extractedContent = response;
        } else {
          extractedContent = JSON.stringify(response);
        }
      }
      
      // Ensure extractedContent is a string
      if (typeof extractedContent !== 'string') {
        extractedContent = JSON.stringify(extractedContent);
      }
      
      console.log('Extracted content for image description:', extractedContent);
      
      // Format for compatibility with fetchImageDescription
      formattedResponse = {
        choices: [
          {
            message: {
              content: extractedContent
            }
          }
        ]
      };
      
      console.log('Image description response formatted successfully:', JSON.stringify(formattedResponse, null, 2));
    } catch (error) {
      console.error('Failed to format image description response:', error);
      // Provide a fallback format with descriptive error
      formattedResponse = {
        choices: [
          {
            message: {
              content: "Failed to process image description: " + (error instanceof Error ? error.message : String(error))
            }
          }
        ]
      };
    }
    
    // Return the response
    return res.status(200).json(formattedResponse);
  } catch (error) {
    if (error instanceof OpenAIError) {
      const { name, message } = error
      console.error('OpenAI Completion Error', message)
      return res.status(400).json({
        statusCode: 400,
        name: name,
        message: message,
      })
    } else {
      console.error('Unexpected Error', error)
      return res.status(500).json({ name: 'Error' })
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
