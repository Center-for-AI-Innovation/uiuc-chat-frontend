// src/types/agentStream.ts
// Typed events for server-side agent streaming

import { type AgentEvent, type UIUCTool } from './chat'

/**
 * Discriminated union type for all agent stream events.
 * Each event has a `type` field that discriminates the union.
 */

/**
 * Sent when the agent is selecting which tools to use for the current step.
 */
export interface AgentSelectionEvent {
  type: 'selection'
  stepNumber: number
  status: 'running' | 'done' | 'error'
  selectedTools?: Array<{
    id: string
    name: string
    readableName: string
    arguments?: Record<string, unknown>
  }>
  info?: string
}

/**
 * Sent when the agent is performing document retrieval.
 */
export interface AgentRetrievalEvent {
  type: 'retrieval'
  stepNumber: number
  status: 'running' | 'done' | 'error'
  query: string
  contextsRetrieved?: number
  errorMessage?: string
}

/**
 * Sent when the agent is executing an N8N tool.
 */
export interface AgentToolEvent {
  type: 'tool'
  stepNumber: number
  status: 'running' | 'done' | 'error'
  toolName: string
  readableToolName: string
  invocationId?: string
  arguments?: Record<string, unknown>
  outputText?: string
  outputData?: Record<string, unknown>
  outputImageUrls?: string[]
  errorMessage?: string
}

/**
 * Sent during final LLM response generation - contains token deltas.
 */
export interface AgentFinalTokensEvent {
  type: 'final_tokens'
  delta: string
  done: boolean
}

/**
 * Sent when the agent has completed processing successfully.
 */
export interface AgentDoneEvent {
  type: 'done'
  conversationId: string
  finalMessageId: string
  // Summary of what was retrieved/used (for client state)
  summary: {
    totalContextsRetrieved: number
    toolsExecuted: Array<{
      name: string
      readableName: string
      hasOutput: boolean
      hasError: boolean
    }>
  }
}

/**
 * Sent when an error occurs during agent processing.
 */
export interface AgentErrorEvent {
  type: 'error'
  message: string
  stepNumber?: number
  recoverable: boolean
}

/**
 * Sent to provide the current agent events array for UI synchronization.
 * This allows the client to update its local agentEvents on the message.
 */
export interface AgentEventsUpdateEvent {
  type: 'agent_events_update'
  agentEvents: AgentEvent[]
  messageId: string
}

/**
 * Sent to provide updated tools array for UI synchronization.
 * This allows the client to track tool outputs without full contexts.
 */
export interface AgentToolsUpdateEvent {
  type: 'tools_update'
  tools: ClientUIUCTool[]
  messageId: string
}

/**
 * Lightweight context metadata for citation processing.
 * This includes only the data needed to generate citation links,
 * NOT the full context text (which can be very large).
 */
export interface ContextMetadata {
  s3_path: string
  readable_filename: string
  url?: string
  base_url?: string
  pagenumber?: string | number
}

/**
 * Sent after retrieval to provide context metadata for citation processing.
 * This allows the client to process citations without having full context text.
 */
export interface AgentContextsMetadataEvent {
  type: 'contexts_metadata'
  messageId: string
  contextsMetadata: ContextMetadata[]
  totalContexts: number
}

/**
 * Lightweight tool representation for client (without full context data in outputs)
 */
export interface ClientUIUCTool {
  id: string
  invocationId?: string
  name: string
  readableName: string
  description: string
  aiGeneratedArgumentValues?: Record<string, string>
  output?: {
    text?: string
    imageUrls?: string[]
    // Note: `data` field is stripped for client - too large
    hasData?: boolean  // Indicates if there was data (without sending it)
  }
  error?: string
}

/**
 * Union of all possible agent stream events.
 */
export type AgentStreamEvent =
  | AgentSelectionEvent
  | AgentRetrievalEvent
  | AgentToolEvent
  | AgentFinalTokensEvent
  | AgentDoneEvent
  | AgentErrorEvent
  | AgentEventsUpdateEvent
  | AgentToolsUpdateEvent
  | AgentContextsMetadataEvent

/**
 * Request body for the agent streaming endpoint.
 */
export interface AgentRunRequest {
  conversationId?: string  // Optional - new conversation if not provided
  courseName: string
  userMessage: {
    id: string
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
    imageUrls?: string[]
  }
  documentGroups: string[]
  model: {
    id: string
    name: string
  }
  temperature: number
  systemPrompt?: string
  // Contexts from file uploads (if any) - these come from client
  fileUploadContexts?: Array<{
    id: number
    text: string
    readable_filename: string
    s3_path: string
    url?: string
  }>
}

/**
 * Helper to serialize an agent stream event for SSE.
 */
export function serializeAgentStreamEvent(event: AgentStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Helper to parse an agent stream event from SSE data line.
 */
export function parseAgentStreamEvent(dataLine: string): AgentStreamEvent | null {
  try {
    // Remove "data: " prefix if present
    const jsonStr = dataLine.startsWith('data: ') 
      ? dataLine.slice(6) 
      : dataLine
    
    const parsed = JSON.parse(jsonStr)
    
    // Validate that it has a type field
    if (parsed && typeof parsed.type === 'string') {
      return parsed as AgentStreamEvent
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Convert UIUCTool to ClientUIUCTool (strips heavy data)
 */
export function toClientUIUCTool(tool: UIUCTool): ClientUIUCTool {
  return {
    id: tool.id,
    invocationId: tool.invocationId,
    name: tool.name,
    readableName: tool.readableName,
    description: tool.description,
    aiGeneratedArgumentValues: tool.aiGeneratedArgumentValues,
    output: tool.output ? {
      text: tool.output.text,
      imageUrls: tool.output.imageUrls,
      hasData: !!tool.output.data,
    } : undefined,
    error: tool.error,
  }
}

