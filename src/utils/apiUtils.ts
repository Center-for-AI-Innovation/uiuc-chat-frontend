// utils/apiUtils.ts
import {
  type CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import { v4 as uuidv4 } from 'uuid'
import { Conversation, Message, Content } from '~/types/chat'
import { CoreMessage } from 'ai'

// Configuration for runtime environment

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_ENV == 'production') return 'https://uiuc.chat'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

/**
 * Calls the API to set or update course metadata.
 * @param {string} courseName - The name of the course.
 * @param {CourseMetadata | CourseMetadataOptionalForUpsert} courseMetadata - The metadata of the course.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating success or failure.
 */
export const callSetCourseMetadata = async (
  courseName: string,
  courseMetadata: CourseMetadata | CourseMetadataOptionalForUpsert,
): Promise<boolean> => {
  try {
    const endpoint = '/api/UIUC-api/upsertCourseMetadata'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName, courseMetadata }),
    })
    const data = await response.json()

    if (data.success) {
      // console.debug('Course metadata updated successfully', {
      //   course_name: courseName,
      //   course_metadata: courseMetadata,
      // })
      return true
    } else {
      console.error('Error setting course metadata', {
        course_name: courseName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    console.error('Error setting course metadata', {
      course_name: courseName,
      error,
    })
    return false
  }
}

/**
 * Uploads a file to S3 using a pre-signed URL.
 * @param {File | null} file - The file to upload.
 * @param {string} course_name - The name of the course associated with the file.
 * @returns {Promise<string | undefined>} - A promise that resolves to the key of the uploaded file or undefined.
 */
export const uploadToS3 = async (
  file: File | null,
  course_name: string,
): Promise<string | undefined> => {
  if (!file) return

  const uniqueFileName = `${uuidv4()}.${file.name.split('.').pop()}`
  const requestObject = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      courseName: course_name,
      uniqueFileName,
    }),
  }

  try {
    const endpoint = '/api/UIUC-api/uploadToS3'
    const response = await fetch(endpoint, requestObject)
    const data: PresignedPostResponse = await response.json()
    const { url, fields } = data.post

    const formData = new FormData()
    Object.entries(fields).forEach(([key, value]) =>
      formData.append(key, value),
    )
    formData.append('file', file)

    await fetch(url, { method: 'POST', body: formData })
    console.debug('File uploaded to S3 successfully', { file_name: file.name })
    return fields.key
  } catch (error) {
    console.error('Error uploading file to S3', { error })
  }
}

/**
 * Fetches a pre-signed URL for downloading a file.
 * @param {string} filePath - The path of the file to download.
 * @param {string} [page] - The page from which the request originates.
 * @returns {Promise<string | null>} - A promise that resolves to the pre-signed URL or null.
 */
export async function fetchPresignedUrl(
  filePath: string,
  courseName?: string,
  page?: string,
): Promise<string | null> {
  try {
    const endpoint = `${getBaseUrl()}/api/download`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, courseName, page }),
    })

    if (!response.ok)
      throw new Error(`Server responded with status code ${response.status}`)
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error fetching presigned URL', { error })
    return null
  }
}

/**
 * Fetches metadata for a specific course.
 * @param {string} course_name - The name of the course.
 * @returns {Promise<any>} - A promise that resolves to the course metadata.
 */
export async function fetchCourseMetadata(course_name: string): Promise<any> {
  try {
    const endpoint = `${getBaseUrl()}/api/UIUC-api/getCourseMetadata?course_name=${course_name}`
    const response = await fetch(endpoint)

    if (!response.ok) {
      throw new Error(
        `Error fetching course metadata: ${response.statusText || response.status}`,
      )
    }

    const data = await response.json()
    if (data.success === false) {
      throw new Error(
        data.message || 'An error occurred while fetching course metadata',
      )
    }

    if (
      data.course_metadata &&
      typeof data.course_metadata.is_private === 'string'
    ) {
      data.course_metadata.is_private =
        data.course_metadata.is_private.toLowerCase() === 'true'
    }

    return data.course_metadata
  } catch (error) {
    console.error('Error fetching course metadata', { course_name, error })
    throw error
  }
}

export function convertConversationToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  // Add system message as the first message
  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  // Convert other messages
  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return // Skip system message as it's already added

    // Check if this is the last user message
    const isLastUserMessage = 
      index === conversation.messages.length - 1 && message.role === 'user'

    // Process content based on type
    let messageContent: any

    if (isLastUserMessage && message.finalPromtEngineeredMessage) {
      // For final user message with images, we need to preserve the array format
      if (Array.isArray(message.content) && 
          message.content.some(c => c.type === 'image_url' || c.type === 'tool_image_url')) {
        
        // Create a new array with the text and images
        messageContent = []
        
        // Add the final prompt as text
        messageContent.push({
          type: 'text',
          text: message.finalPromtEngineeredMessage
        })
        
        // First add any image descriptions that exist
        const imageDescriptions = Array.isArray(message.content) 
          ? message.content.filter(
              (content): content is Content => content.type === 'text' && content.imageDescription === true
            )
          : []
        
        if (imageDescriptions.length > 0) {
          imageDescriptions.forEach(desc => {
            messageContent.push({
              type: 'text',
              text: desc.text
            })
          })
        }
        
        // Add any images from the original content
        if (Array.isArray(message.content)) {
          message.content.forEach(content => {
            if (content.type === 'image_url' || content.type === 'tool_image_url') {
              // Add image description before the image if available
              if (content.text) {
                // Check if we already have this description
                const alreadyHasDescription = Array.isArray(message.content) && 
                  message.content.some((c: Content) => 
                    c.type === 'text' && 
                    c.imageDescription === true && 
                    typeof c.text === 'string' && 
                    typeof content.text === 'string' &&
                    c.text.includes(content.text)
                  );
                
                if (!alreadyHasDescription) {
                  messageContent.push({
                    type: 'text',
                    text: `Image description: ${content.text}`
                  });
                }
              }
              
              // Use the correct format for Vercel AI SDK v3
              messageContent.push({
                type: 'image',
                image: content.image_url?.url || '',
              });
            }
          });
        }
      } else {
        // Text-only final message
        messageContent = message.finalPromtEngineeredMessage
      }
    } else if (Array.isArray(message.content)) {
      // Check if there are image_url or tool_image_url types
      const hasImages = message.content.some(c => 
        c.type === 'image_url' || c.type === 'tool_image_url'
      )

      if (hasImages) {
        // For Claude and other providers that need array format with text and images
        messageContent = []
        
        // First add any regular text content
        const textContents = message.content.filter(
          content => content.type === 'text' && !content.imageDescription
        )
        
        textContents.forEach(content => {
          messageContent.push({
            type: 'text',
            text: content.text
          })
        })
        
        // Then add image descriptions that already exist
        const imageDescriptions = message.content.filter(
          content => content.type === 'text' && content.imageDescription === true
        )
        
        if (imageDescriptions.length > 0) {
          imageDescriptions.forEach(desc => {
            messageContent.push({
              type: 'text',
              text: desc.text
            })
          })
        }
        
        // Finally add images
        message.content.forEach(content => {
          if (content.type === 'image_url' || content.type === 'tool_image_url') {
            // Add image description before the image if available and not already added
            if (content.text && !imageDescriptions.some(desc => 
                desc.text?.includes(content.text as string))) {
              messageContent.push({
                type: 'text',
                text: `Image description: ${content.text}`
              })
            }
            
            // Convert to the format expected by Vercel AI SDK
            messageContent.push({
              type: 'image',
              image: content.image_url?.url || '',
            })
          }
        })
      } else {
        // No images, just combine text content
        messageContent = message.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n')
      }
    } else {
      // Handle string content
      messageContent = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: messageContent,
    })
  })

  return coreMessages
}

export function convertConversationToCoreMessagesWithoutSystem(
  conversation: Conversation,
): CoreMessage[] {
  function processMessageContent(message: Message, isLastUserMessage: boolean) {
    let content: any[]

    if (isLastUserMessage && message.finalPromtEngineeredMessage) {
      content = [{ type: 'text', text: message.finalPromtEngineeredMessage }]
      
      // First add any image descriptions that exist
      if (Array.isArray(message.content)) {
        const imageDescriptions = message.content.filter(
          (c): c is Content => c.type === 'text' && c.imageDescription === true
        )
        
        if (imageDescriptions.length > 0) {
          imageDescriptions.forEach(desc => {
            content.push({
              type: 'text',
              text: desc.text
            })
          })
        }
        
        // If final message has images, include them
        message.content.forEach(c => {
          if (c.type === 'image_url' || c.type === 'tool_image_url') {
            // Add image description before the image if available
            if (c.text) {
              // Check if we already have this description
              const alreadyHasDescription = imageDescriptions.some(desc => 
                typeof desc.text === 'string' && 
                typeof c.text === 'string' && 
                desc.text.includes(c.text)
              )
              
              if (!alreadyHasDescription) {
                content.push({
                  type: 'text',
                  text: `Image description: ${c.text}`
                })
              }
            }
            
            content.push({
              type: 'image',
              image: c.image_url?.url || ''
            })
          }
        })
      }
    } else if (Array.isArray(message.content)) {
      content = []
      
      // First add regular text content
      const textContents = message.content.filter(
        c => c.type === 'text' && !c.imageDescription
      )
      
      textContents.forEach(c => {
        content.push({ type: 'text', text: c.text })
      })
      
      // Then add image descriptions
      const imageDescriptions = message.content.filter(
        c => c.type === 'text' && c.imageDescription === true
      )
      
      if (imageDescriptions.length > 0) {
        imageDescriptions.forEach(desc => {
          content.push({
            type: 'text',
            text: desc.text
          })
        })
      }
      
      // Finally add images
      message.content.forEach(c => {
        if (c.type === 'image_url' || c.type === 'tool_image_url') {
          // Add image description before the image if available and not already added
          if (c.text) {
            const alreadyHasDescription = imageDescriptions.some(desc => 
              typeof desc.text === 'string' && 
              typeof c.text === 'string' && 
              desc.text.includes(c.text)
            )
            
            if (!alreadyHasDescription) {
              content.push({
                type: 'text',
                text: `Image description: ${c.text}`
              })
            }
          }
          
          // Convert to the format expected by Vercel AI SDK
          content.push({ 
            type: 'image',
            image: c.image_url?.url || ''
          })
        }
      })
    } else {
      content = [{ type: 'text', text: message.content as string }]
    }

    return content
  }

  return conversation.messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => {
      const isLastUserMessage =
        index === conversation.messages.length - 1 && message.role === 'user'

      return {
        role: message.role as 'user' | 'assistant',
        content: processMessageContent(message, isLastUserMessage),
      }
    })
}

// Helper Types
interface PresignedPostResponse {
  post: {
    url: string
    fields: { [key: string]: string }
  }
}

// Export all functions as part of the API Utils module
export default {
  callSetCourseMetadata,
  uploadToS3,
  fetchPresignedUrl,
  fetchCourseMetadata,
}
