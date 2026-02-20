// Mutation: Uploads a file within a chat conversation for inline reference. Returns fileUploadId and chunks created.
import { useMutation } from '@tanstack/react-query'

export type ChatFileUploadRequest = {
  conversationId: string
  courseName: string
  user_id: string
  s3Key: string
  fileName: string
  fileType: string
  model?: string
}

export type ChatFileUploadResponse = {
  success?: boolean
  fileUploadId?: string
  message?: string
  error?: string
  details?: string
  chunks_created?: number
}

async function chatFileUpload(
  body: ChatFileUploadRequest,
): Promise<ChatFileUploadResponse> {
  const response = await fetch('/api/UIUC-api/chat-file-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('File too large, please upload a smaller file')
  }

  return response.json()
}

export function useChatFileUpload() {
  return useMutation({
    mutationKey: ['chatFileUpload'],
    mutationFn: chatFileUpload,
  })
}
