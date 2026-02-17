// src/types/clientConversation.ts
// Lightweight client-facing DTOs that strip heavy context data

import {
  type Conversation,
  type Message,
  type UIUCTool,
  type AgentEvent,
  type MessageFeedback,
  type Content,
  type Role,
} from './chat'
import { type ClientUIUCTool, toClientUIUCTool } from './agentStream'
import { type AnySupportedModel } from '~/utils/modelProviders/LLMProvider'

/**
 * Lightweight message for client-side storage.
 * Contexts are stripped to reduce localStorage bloat.
 * Instead, we track contextsCount for UI display.
 */
export interface ClientMessage {
  id: string
  role: Role
  content: string | Content[]
  // Contexts are NOT included - they stay on the server
  // But we track how many were retrieved for UI display
  contextsCount?: number
  // Tools without heavy output.data
  tools?: ClientUIUCTool[]
  latestSystemMessage?: string
  finalPromtEngineeredMessage?: string
  responseTimeSec?: number
  imageDescription?: string
  imageUrls?: string[]
  conversation_id?: string
  created_at?: string
  updated_at?: string
  feedback?: MessageFeedback
  wasQueryRewritten?: boolean
  queryRewriteText?: string
  agentStepNumber?: number
  agentEvents?: AgentEvent[]
}

/**
 * Lightweight conversation for client-side storage.
 * Uses ClientMessage instead of Message to reduce data size.
 */
export interface ClientConversation {
  id: string
  name: string
  messages: ClientMessage[]
  model: AnySupportedModel
  prompt: string
  temperature: number
  folderId: string | null
  userEmail?: string
  projectName?: string
  createdAt?: string
  updatedAt?: string
  agentModeEnabled?: boolean
  linkParameters?: {
    guidedLearning: boolean
    documentsOnly: boolean
    systemPromptOnly: boolean
  }
}

/**
 * Convert a UIUCTool to ClientUIUCTool (strips heavy data).
 * Re-exported from agentStream for convenience.
 */
export { toClientUIUCTool } from './agentStream'

/**
 * Convert a full Message to a lightweight ClientMessage.
 * Strips contexts but preserves count for UI display.
 */
export function toClientMessage(message: Message): ClientMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    contextsCount: message.contexts?.length ?? 0,
    tools: message.tools?.map(toClientUIUCTool),
    latestSystemMessage: message.latestSystemMessage,
    finalPromtEngineeredMessage: message.finalPromtEngineeredMessage,
    responseTimeSec: message.responseTimeSec,
    imageDescription: message.imageDescription,
    imageUrls: message.imageUrls,
    conversation_id: message.conversation_id,
    created_at: message.created_at,
    updated_at: message.updated_at,
    feedback: message.feedback,
    wasQueryRewritten: message.wasQueryRewritten,
    queryRewriteText: message.queryRewriteText,
    agentStepNumber: message.agentStepNumber,
    agentEvents: message.agentEvents,
  }
}

/**
 * Convert a full Conversation to a lightweight ClientConversation.
 * Strips contexts from all messages to reduce localStorage bloat.
 */
export function toClientConversation(
  conversation: Conversation,
): ClientConversation {
  return {
    id: conversation.id,
    name: conversation.name,
    messages: conversation.messages.map(toClientMessage),
    model: conversation.model,
    prompt: conversation.prompt,
    temperature: conversation.temperature,
    folderId: conversation.folderId,
    userEmail: conversation.userEmail,
    projectName: conversation.projectName,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    agentModeEnabled: conversation.agentModeEnabled,
    linkParameters: conversation.linkParameters,
  }
}

/**
 * Merge a ClientConversation back into a full Conversation.
 * Contexts will be empty since they're not stored on client.
 * Used when we need to reconstruct a Conversation from client state.
 */
export function fromClientConversation(
  clientConversation: ClientConversation,
): Conversation {
  return {
    id: clientConversation.id,
    name: clientConversation.name,
    messages: clientConversation.messages.map(
      (clientMessage): Message => ({
        id: clientMessage.id,
        role: clientMessage.role,
        content: clientMessage.content,
        // Contexts are not available on client - will be fetched from server if needed
        contexts: undefined,
        tools: clientMessage.tools?.map(
          (clientTool): UIUCTool => ({
            id: clientTool.id,
            invocationId: clientTool.invocationId,
            name: clientTool.name,
            readableName: clientTool.readableName,
            description: clientTool.description,
            aiGeneratedArgumentValues: clientTool.aiGeneratedArgumentValues,
            output: clientTool.output
              ? {
                  text: clientTool.output.text,
                  imageUrls: clientTool.output.imageUrls,
                  // Note: data is not available on client
                }
              : undefined,
            error: clientTool.error,
          }),
        ),
        latestSystemMessage: clientMessage.latestSystemMessage,
        finalPromtEngineeredMessage: clientMessage.finalPromtEngineeredMessage,
        responseTimeSec: clientMessage.responseTimeSec,
        imageDescription: clientMessage.imageDescription,
        imageUrls: clientMessage.imageUrls,
        conversation_id: clientMessage.conversation_id,
        created_at: clientMessage.created_at,
        updated_at: clientMessage.updated_at,
        feedback: clientMessage.feedback,
        wasQueryRewritten: clientMessage.wasQueryRewritten,
        queryRewriteText: clientMessage.queryRewriteText,
        agentStepNumber: clientMessage.agentStepNumber,
        agentEvents: clientMessage.agentEvents,
      }),
    ),
    model: clientConversation.model,
    prompt: clientConversation.prompt,
    temperature: clientConversation.temperature,
    folderId: clientConversation.folderId,
    userEmail: clientConversation.userEmail,
    projectName: clientConversation.projectName,
    createdAt: clientConversation.createdAt,
    updatedAt: clientConversation.updatedAt,
    agentModeEnabled: clientConversation.agentModeEnabled,
    linkParameters: clientConversation.linkParameters,
  }
}

/**
 * Check if a conversation object is a ClientConversation (has contextsCount instead of contexts).
 */
export function isClientConversation(
  conversation: Conversation | ClientConversation,
): conversation is ClientConversation {
  if (conversation.messages.length === 0) return false
  const firstMessage = conversation.messages[0]
  if (!firstMessage) return false
  // ClientMessage has contextsCount, Message has contexts
  return 'contextsCount' in firstMessage && !('contexts' in firstMessage)
}
