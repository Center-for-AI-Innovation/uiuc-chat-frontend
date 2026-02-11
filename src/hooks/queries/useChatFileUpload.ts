import { useMutation } from '@tanstack/react-query'
import {
  type ChatFileUploadRequest,
  type ChatFileUploadResponse,
} from './types'

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
