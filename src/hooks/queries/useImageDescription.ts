// Mutation: Generates image descriptions for image inputs in chat messages.
import { useMutation } from '@tanstack/react-query'

import { type Conversation, type Message } from '@/types/chat'
import { handleImageContent } from '~/utils/streamProcessing'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'
import { mutationKeys } from './keys'

export interface ImageDescriptionVariables {
  message: Message
  courseName: string
  updatedConversation: Conversation
  searchQuery: string
  llmProviders: AllLLMProviders
  controller: AbortController
}

async function runImageDescription({
  message,
  courseName,
  updatedConversation,
  searchQuery,
  llmProviders,
  controller,
}: ImageDescriptionVariables) {
  return handleImageContent(
    message,
    courseName,
    updatedConversation,
    searchQuery,
    llmProviders,
    controller,
  )
}

export function useImageDescription() {
  return useMutation({
    mutationKey: mutationKeys.imageDescription(),
    mutationFn: runImageDescription,
  })
}
