// src/pages/api/UIUC-api/fetchImageDescription.ts

import { Conversation, ImageBody } from '@/types/chat'
import { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

export const config = {
  runtime: 'edge',
}

/**
 * Asynchronously fetches a description for images contained within a message.
 * It constructs a request body with the necessary details and sends a POST request
 * to the specified endpoint. It handles errors and logs them for easier debugging.
 *
 * @param {string} course_name - The name of the course for context.
 * @param {Conversation} updatedConversation - The updated conversation object.
 * @param {string} apiKey - The API key for authorization.
 * @param {AbortController} controller - The controller to abort the fetch request if necessary.
 * @returns {Promise<string>} A promise that resolves to the image description.
 */
export const fetchImageDescription = async (
  course_name: string,
  updatedConversation: Conversation,
  llmProviders: AllLLMProviders,
  controller: AbortController,
): Promise<string> => {
  // Construct the body for the chat API request
  const imageBody: ImageBody = {
    conversation: updatedConversation,
    llmProviders: llmProviders,
    course_name: course_name,
  }

  try {
    // Send the POST request to the API endpoint
    const response = await fetch('/api/imageDescription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageBody),
      signal: controller.signal,
    })

    // If the response is not ok, throw an error with the message from the response
    if (!response.ok) {
      const errorResponse = await response.json()
      throw new Error(errorResponse.message)
    }

    // Parse the JSON response and return the image description
    const data = await response.json()
    console.log('Image description data:', data)
    return data.choices[0].message.content || ''
  } catch (error) {
    // Log the error to the console and abort the fetch request
    console.error('Error fetching image description:', error)
    controller.abort()

    // Re-throw the error to be handled by the caller
    throw error
  }
}
