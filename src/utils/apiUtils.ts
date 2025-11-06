// utils/apiUtils.ts
import { CoreMessage } from 'ai'
import { v4 as uuidv4 } from 'uuid'
import { Conversation, Message } from '~/types/chat'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
// Configuration for runtime environment

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_ENV == 'production') return 'https://uiuc.chat'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

/**
 * Gets the backend URL from environment variables.
 * Throws an error if RAILWAY_URL is not configured.
 * @returns {string} - The validated backend URL
 * @throws {Error} - If RAILWAY_URL is not set
 */
export const getBackendUrl = (): string => {
  const backendUrl = process.env.RAILWAY_URL

  if (!backendUrl) {
    throw new Error(
      'Backend URL is not configured. Please set the RAILWAY_URL environment variable.',
    )
  }

  // Remove trailing slash if present for consistency
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
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
 * @param {string} user_id - The user ID associated with the file.
 * @param {string} course_name - The name of the course associated with the file.
 * @param {string} uploadType - The type of upload ('chat' or 'document-group').
 * @returns {Promise<string | undefined>} - A promise that resolves to the key of the uploaded file or undefined.
 */
export const uploadToS3 = async (
  file: File | null,
  user_id: string,
  course_name: string,
  uploadType: 'chat' | 'document-group' = 'document-group',
): Promise<string | undefined> => {
  if (!file) return

  const uniqueFileName = `${uuidv4()}.${file.name.split('.').pop()}`
  const requestObject = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      user_id: user_id,
      courseName: course_name,
      uniqueFileName,
      uploadType,
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
  fileName?: string,
): Promise<string | null> {
  try {
    const endpoint = `${getBaseUrl()}/api/download`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, courseName, page, fileName }),
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

export function convertConversatonToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  // Add system message as the first message
  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    console.log(
      'Found system message, latestSystemMessage: ',
      systemMessage.latestSystemMessage,
    )
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  // Convert other messages
  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return // Skip system message as it's already added

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      // Use finalPromtEngineeredMessage for the most recent user message
      content = message.finalPromtEngineeredMessage || ''
    } else if (Array.isArray(message.content)) {
      // Handle both text and file content
      const textParts: string[] = []

      message.content.forEach((c) => {
        if (c.type === 'text') {
          textParts.push(c.text || '')
        } else if (c.type === 'file') {
          // Convert file content to text representation
          textParts.push(
            `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          )
        }
      })

      content = textParts.join('\n')
    } else {
      content = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: content,
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
    } else if (Array.isArray(message.content)) {
      content = message.content.map((c) => {
        if (c.type === 'text') {
          return { type: 'text', text: c.text }
        } else if (c.type === 'image_url') {
          return { type: 'image', image: c.image_url!.url }
        } else if (c.type === 'file') {
          // Convert file content to text representation
          return {
            type: 'text',
            text: `[File: ${c.fileName || 'unknown'} (${c.fileType || 'unknown type'}, ${c.fileSize ? Math.round(c.fileSize / 1024) + 'KB' : 'unknown size'})]`,
          }
        }
        return c
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
      console.log(
        'Processing message:',
        message.role,
        isLastUserMessage ? '(last user message)' : '',
      )

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
/**
 * Create a new project
 * @param project_name - The name of the project
 * @param project_description - Optional description of the project
 * @param project_owner_email - Email of the project owner
 * @param is_private - Whether the project is private (default: false)
 * @returns Promise<boolean> - true if successful, throws error on failure
 */
export const createProject = async (
  project_name: string,
  project_description: string | undefined,
  project_owner_email: string,
  is_private = false,
): Promise<boolean> => {
  try {
    const response = await fetch('/api/UIUC-api/createProject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_name,
        project_description,
        project_owner_email,
        is_private,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `Failed to create the project. Status: ${response.status}`,
      }))

      // Throw error with status code and message for better error handling
      const error = new Error(errorData.message || errorData.error) as Error & {
        status?: number
        error?: string
      }
      error.status = response.status
      error.error = errorData.error
      throw error
    }

    return true
  } catch (error) {
    console.error(error)
    throw error
  }
}

