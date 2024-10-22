// utils/apiUtils.ts
import {
  CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import { log } from 'next-axiom'
import { v4 as uuidv4 } from 'uuid'

// Configuration for runtime environment
export const config = {
  runtime: 'edge',
}

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
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
      log.debug('Course metadata updated successfully', {
        course_name: courseName,
        course_metadata: courseMetadata,
      })
      return true
    } else {
      log.error('Error setting course metadata', {
        course_name: courseName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    log.error('Error setting course metadata', {
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
    log.info('File uploaded to S3 successfully', { file_name: file.name })
    return fields.key
  } catch (error) {
    log.error('Error uploading file to S3', { error })
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
  page?: string,
): Promise<string | null> {
  try {
    const endpoint = `${getBaseUrl()}/api/download`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, page }),
    })

    if (!response.ok)
      throw new Error(`Server responded with status code ${response.status}`)
    const data = await response.json()
    return data.url
  } catch (error) {
    log.error('Error fetching presigned URL', { error })
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
    log.error('Error fetching course metadata', { course_name, error })
    throw error
  }
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
