// Mutation: Routes a message to relevant tools before execution.
import { useMutation } from '@tanstack/react-query'

import { type Conversation, type Message, type UIUCTool } from '@/types/chat'
import { mutationKeys } from './keys'
import { handleFunctionCall } from '~/utils/functionCalling/handleFunctionCalling'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

export interface RouteToolsVariables {
  message: Message
  tools: UIUCTool[]
  imageUrls: string[]
  imgDesc: string
  updatedConversation: Conversation
  openAIKey: string
  courseName: string
  llmProviders: AllLLMProviders
}

async function routeTools({
  message,
  tools,
  imageUrls,
  imgDesc,
  updatedConversation,
  openAIKey,
  courseName,
  llmProviders,
}: RouteToolsVariables) {
  return handleFunctionCall(
    message,
    tools,
    imageUrls,
    imgDesc,
    updatedConversation,
    openAIKey,
    courseName,
    undefined,
    llmProviders,
  )
}

export function useRouteTools() {
  return useMutation({
    mutationKey: mutationKeys.routeTools(),
    mutationFn: routeTools,
  })
}
