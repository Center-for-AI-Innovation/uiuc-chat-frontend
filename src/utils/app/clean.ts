import { Conversation, ConversationPage } from '@/types/chat'
import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from './const'

export const cleanSelectedConversation = (conversation: Conversation) => {
  // added model for each conversation (3/20/23)
  // added system prompt for each conversation (3/21/23)
  // added folders (3/23/23)
  // added prompts (3/26/23)
  // added messages (4/16/23)

  let updatedConversation = conversation

  // check for model on each conversation
  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || OpenAIModels[OpenAIModelID.GPT_4], // ! the default fallback was causing inf loop issues
    }
  }

  // check for system prompt on each conversation
  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT,
    }
  }

  if (!updatedConversation.temperature) {
    updatedConversation = {
      ...updatedConversation,
      temperature: updatedConversation.temperature || DEFAULT_TEMPERATURE,
    }
  }

  if (!updatedConversation.folderId) {
    updatedConversation = {
      ...updatedConversation,
      folderId: updatedConversation.folderId || null,
    }
  }

  if (!updatedConversation.messages) {
    updatedConversation = {
      ...updatedConversation,
      messages: updatedConversation.messages || [],
    }
  }

  return updatedConversation
}

export const cleanConversationHistory = (history: any[]): ConversationPage => {
  // added model for each conversation (3/20/23)
  // added system prompt for each conversation (3/21/23)
  // added folders (3/23/23)
  // added prompts (3/26/23)
  // added messages (4/16/23)

  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.')
    return {
      conversations: [],
      nextCursor: null,
    }
  }

  return history.reduce((acc: Conversation[], conversation) => {
    try {
      if (!conversation.model) {
        conversation.model = OpenAIModels[OpenAIModelID.GPT_4]
      }

      if (!conversation.prompt) {
        conversation.prompt = DEFAULT_SYSTEM_PROMPT
      }

      if (!conversation.temperature) {
        conversation.temperature = DEFAULT_TEMPERATURE
      }

      if (!conversation.folderId) {
        conversation.folderId = null
      }

      if (!conversation.messages) {
        conversation.messages = []
      }

      acc.push(conversation)
      return acc
    } catch (error) {
      console.warn(
        `error while cleaning conversations' history. Removing culprit`,
        error,
      )
    }
    return {
      conversations: acc,
    }
  }, [])
}
