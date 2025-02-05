// utils/apiUtils.ts
import {
  type CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import { v4 as uuidv4 } from 'uuid'
import { Conversation, Message } from '~/types/chat'
import { CoreMessage } from 'ai'
import {
  type MetadataGenerationResponse,
  type DocumentStatus,
  type MetadataDocument,
  type MetadataField,
  type MetadataRun,
} from '~/types/metadata'

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
    console.log('Vercel base URL', process.env.VERCEL_URL)
    const endpoint = `${getBaseUrl()}/api/UIUC-api/getCourseMetadata?course_name=${course_name}`
    console.log('endpoint url of metadata:', endpoint)
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

      // just for Llama 3.1 70b, remind it to use proper citation format.
      content +=
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
    } else if (Array.isArray(message.content)) {
      // Combine text content from array
      content = message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
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
        }
        return c
      })
    } else {
      content = [{ type: 'text', text: message.content as string }]
    }

    if (isLastUserMessage) {
      const citationReminder =
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
      if (content[0].type === 'text') {
        content[0].text += citationReminder
      } else {
        content.push({ type: 'text', text: citationReminder })
      }
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

// Function to generate metadata
export async function generateMetadata(
  prompt: string,
  documentIds: number[],
): Promise<MetadataGenerationResponse> {
  const response = await fetch(
    `https://flask-pr-363.up.railway.app/generateMetadata`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata_prompt: prompt,
        document_ids: documentIds,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to generate metadata')
  }

  return response.json()
}

// Function to check document statuses
export async function getDocumentStatuses(
  documentIds: number[],
  runId: number,
): Promise<DocumentStatus[]> {
  // If no document IDs, return empty array
  if (!documentIds?.length) return []

  const queryParams = new URLSearchParams({
    run_id: runId.toString(),
    document_ids: documentIds.join(','),
  })

  const response = await fetch(
    `/api/UIUC-api/getDocumentStatuses?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get document statuses')
  }

  const data = await response.json()
  return data.statuses || []
}

// Function to get metadata history from cedar_runs table
export async function getMetadataHistory(
  courseName: string,
): Promise<MetadataRun[]> {
  const response = await fetch(
    `/api/UIUC-api/getMetadataHistory?course_name=${encodeURIComponent(courseName)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to get metadata history')
  }

  const data = await response.json()
  return data.history || []
}

// Function to download metadata CSV
export async function downloadMetadataCSV(runIds: number[]): Promise<Blob> {
  const response = await fetch(
    `https://flask-pr-363.up.railway.app/downloadMetadataCSV`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_ids: runIds,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to download metadata CSV')
  }

  return response.blob()
}

// Function to get metadata documents from cedar_documents table
export async function getMetadataDocuments(
  courseName: string,
): Promise<MetadataDocument[]> {
  const response = await fetch(
    `/api/UIUC-api/getMetadataDocuments?course_name=${encodeURIComponent(courseName)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to get metadata documents: ${response.statusText}`)
  }

  return response.json()
}

export async function getMetadataFields(
  runId: number,
): Promise<MetadataField[]> {
  const response = await fetch(
    `/api/UIUC-api/getMetadataFields?run_id=${runId}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch metadata fields')
  }

  const data = await response.json()
  return data.metadata || []
}

// Export all functions as part of the API Utils module
const apiUtils = {
  callSetCourseMetadata,
  uploadToS3,
  fetchPresignedUrl,
  fetchCourseMetadata,
  getMetadataDocuments,
  getMetadataFields,
}

export default apiUtils
