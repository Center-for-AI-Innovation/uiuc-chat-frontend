// src/hooks/useAgentStream.ts
// Hook for consuming agent stream events from /api/agent

import { useCallback, useRef } from 'react'
import {
  type AgentRunRequest,
  type AgentStreamEvent,
  type AgentSelectionEvent,
  type ClientUIUCTool,
  type ContextMetadata,
  parseAgentStreamEvent,
} from '~/types/agentStream'
import { type AgentEvent } from '~/types/chat'

export interface UseAgentStreamCallbacks {
  onInitializing?: (
    messageId: string,
    conversationId: string | undefined,
    assistantMessageId: string,
  ) => void
  onSelectionStart?: (stepNumber: number) => void
  onSelectionDone?: (stepNumber: number, event: AgentSelectionEvent) => void
  onRetrievalStart?: (stepNumber: number, query: string) => void
  onRetrievalDone?: (
    stepNumber: number,
    query: string,
    contextsRetrieved: number,
  ) => void
  onToolStart?: (
    stepNumber: number,
    toolName: string,
    readableToolName: string,
  ) => void
  onToolDone?: (
    stepNumber: number,
    toolName: string,
    output?: { text?: string; imageUrls?: string[] },
    error?: string,
  ) => void
  onAgentEventsUpdate?: (agentEvents: AgentEvent[], messageId: string) => void
  onToolsUpdate?: (tools: ClientUIUCTool[], messageId: string) => void
  onContextsMetadata?: (
    messageId: string,
    contextsMetadata: ContextMetadata[],
    totalContexts: number,
  ) => void
  onFinalTokens?: (delta: string, done: boolean) => void
  onDone?: (
    conversationId: string,
    finalMessageId: string,
    summary: {
      totalContextsRetrieved: number
      toolsExecuted: Array<{
        name: string
        readableName: string
        hasOutput: boolean
        hasError: boolean
      }>
    },
  ) => void
  onError?: (
    message: string,
    stepNumber?: number,
    recoverable?: boolean,
  ) => void
}

export interface UseAgentStreamReturn {
  runAgent: (request: AgentRunRequest) => Promise<void>
  abort: () => void
  isRunning: boolean
}

export function useAgentStream(
  callbacks: UseAgentStreamCallbacks,
): UseAgentStreamReturn {
  const abortControllerRef = useRef<AbortController | null>(null)
  const isRunningRef = useRef(false)

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    isRunningRef.current = false
  }, [])

  const runAgent = useCallback(
    async (request: AgentRunRequest) => {
      // Abort any existing request
      abort()

      const controller = new AbortController()
      abortControllerRef.current = controller
      isRunningRef.current = true

      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }))
          callbacks.onError?.(
            errorData.error || `HTTP ${response.status}`,
            undefined,
            false,
          )
          isRunningRef.current = false
          return
        }

        if (!response.body) {
          callbacks.onError?.('No response body', undefined, false)
          isRunningRef.current = false
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Process complete events (split by double newline for SSE)
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || '' // Keep incomplete event in buffer

            for (const line of lines) {
              if (!line.trim()) continue

              // Each SSE event is prefixed with "data: "
              const dataLines = line
                .split('\n')
                .filter((l) => l.startsWith('data: '))

              for (const dataLine of dataLines) {
                const event = parseAgentStreamEvent(dataLine)
                if (!event) continue

                await new Promise((resolve) => setTimeout(resolve, 0))

                // Dispatch to appropriate callback based on event type
                switch (event.type) {
                  case 'initializing':
                    callbacks.onInitializing?.(
                      event.messageId,
                      event.conversationId,
                      event.assistantMessageId,
                    )
                    break

                  case 'selection':
                    if (event.status === 'running') {
                      callbacks.onSelectionStart?.(event.stepNumber)
                    } else {
                      callbacks.onSelectionDone?.(
                        event.stepNumber,
                        event as any,
                      )
                    }
                    break

                  case 'retrieval':
                    if (event.status === 'running') {
                      callbacks.onRetrievalStart?.(
                        event.stepNumber,
                        event.query,
                      )
                    } else {
                      callbacks.onRetrievalDone?.(
                        event.stepNumber,
                        event.query,
                        event.contextsRetrieved || 0,
                      )
                    }
                    break

                  case 'tool':
                    if (event.status === 'running') {
                      callbacks.onToolStart?.(
                        event.stepNumber,
                        event.toolName,
                        event.readableToolName,
                      )
                    } else {
                      callbacks.onToolDone?.(
                        event.stepNumber,
                        event.toolName,
                        event.outputText || event.outputImageUrls
                          ? {
                              text: event.outputText,
                              imageUrls: event.outputImageUrls,
                            }
                          : undefined,
                        event.errorMessage,
                      )
                    }
                    break

                  case 'agent_events_update':
                    callbacks.onAgentEventsUpdate?.(
                      event.agentEvents,
                      event.messageId,
                    )
                    break

                  case 'tools_update':
                    callbacks.onToolsUpdate?.(event.tools, event.messageId)
                    break

                  case 'contexts_metadata':
                    callbacks.onContextsMetadata?.(
                      event.messageId,
                      event.contextsMetadata,
                      event.totalContexts,
                    )
                    break

                  case 'final_tokens':
                    callbacks.onFinalTokens?.(event.delta, event.done)
                    break

                  case 'done':
                    callbacks.onDone?.(
                      event.conversationId,
                      event.finalMessageId,
                      event.summary,
                    )
                    break

                  case 'error':
                    callbacks.onError?.(
                      event.message,
                      event.stepNumber,
                      event.recoverable,
                    )
                    break
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Request was aborted, don't treat as error
          return
        }
        callbacks.onError?.(
          error instanceof Error ? error.message : 'Unknown error',
          undefined,
          false,
        )
      } finally {
        isRunningRef.current = false
        abortControllerRef.current = null
      }
    },
    [callbacks, abort],
  )

  return {
    runAgent,
    abort,
    isRunning: isRunningRef.current,
  }
}

/**
 * Standalone function to run agent without using the hook.
 * Useful for calling from class components or outside React.
 */
export async function runAgentStream(
  request: AgentRunRequest,
  callbacks: UseAgentStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))
      callbacks.onError?.(
        errorData.error || `HTTP ${response.status}`,
        undefined,
        false,
      )
      return
    }

    if (!response.body) {
      callbacks.onError?.('No response body', undefined, false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete events
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          const dataLines = line
            .split('\n')
            .filter((l) => l.startsWith('data: '))

          for (const dataLine of dataLines) {
            const event = parseAgentStreamEvent(dataLine)
            if (!event) continue

            await new Promise((resolve) => setTimeout(resolve, 0))

            switch (event.type) {
              case 'initializing':
                callbacks.onInitializing?.(
                  event.messageId,
                  event.conversationId,
                  event.assistantMessageId,
                )
                break

              case 'selection':
                if (event.status === 'running') {
                  callbacks.onSelectionStart?.(event.stepNumber)
                } else {
                  callbacks.onSelectionDone?.(event.stepNumber, event as any)
                }
                break

              case 'retrieval':
                if (event.status === 'running') {
                  callbacks.onRetrievalStart?.(event.stepNumber, event.query)
                } else {
                  callbacks.onRetrievalDone?.(
                    event.stepNumber,
                    event.query,
                    event.contextsRetrieved || 0,
                  )
                }
                break

              case 'tool':
                if (event.status === 'running') {
                  callbacks.onToolStart?.(
                    event.stepNumber,
                    event.toolName,
                    event.readableToolName,
                  )
                } else {
                  callbacks.onToolDone?.(
                    event.stepNumber,
                    event.toolName,
                    event.outputText || event.outputImageUrls
                      ? {
                          text: event.outputText,
                          imageUrls: event.outputImageUrls,
                        }
                      : undefined,
                    event.errorMessage,
                  )
                }
                break

              case 'agent_events_update':
                callbacks.onAgentEventsUpdate?.(
                  event.agentEvents,
                  event.messageId,
                )
                break

              case 'tools_update':
                callbacks.onToolsUpdate?.(event.tools, event.messageId)
                break

              case 'contexts_metadata':
                callbacks.onContextsMetadata?.(
                  event.messageId,
                  event.contextsMetadata,
                  event.totalContexts,
                )
                break

              case 'final_tokens':
                callbacks.onFinalTokens?.(event.delta, event.done)
                break

              case 'done':
                callbacks.onDone?.(
                  event.conversationId,
                  event.finalMessageId,
                  event.summary,
                )
                break

              case 'error':
                callbacks.onError?.(
                  event.message,
                  event.stepNumber,
                  event.recoverable,
                )
                break
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return
    }
    callbacks.onError?.(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      false,
    )
  }
}
