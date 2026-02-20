// Mutation: Generates a presigned S3 POST URL and uploads a file to S3. Also exports the raw function.
import { useMutation } from '@tanstack/react-query'

export type UploadToS3Request = {
  file: File
  uniqueFileName: string
  courseName: string
  user_id?: string
  uploadType?: 'chat' | 'document-group'
}

export interface PresignedPostResponse {
  post: {
    url: string
    fields: { [key: string]: string }
  }
}

async function uploadToS3({
  file,
  uniqueFileName,
  courseName,
  user_id,
  uploadType,
}: UploadToS3Request): Promise<string | undefined> {
  const response = await fetch('/api/UIUC-api/uploadToS3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uniqueFileName,
      fileType: file.type,
      courseName,
      user_id,
      uploadType,
    }),
  })

  if (!response.ok) {
    console.error('Error generating presigned URL:', response.status)
    throw new Error(`Error generating presigned URL: ${response.status}`)
  }

  const data: PresignedPostResponse = await response.json()
  const { url, fields } = data.post

  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value))
  formData.append('file', file)

  await fetch(url, { method: 'POST', body: formData })
  console.debug('File uploaded to S3 successfully', { file_name: file.name })
  return fields.key
}

export { uploadToS3 }

export function useUploadToS3() {
  return useMutation({
    mutationKey: ['uploadToS3'],
    mutationFn: uploadToS3,
  })
}
