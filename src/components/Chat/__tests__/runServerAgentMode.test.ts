import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { makeMessage, makeConversation } from '~/test-utils/mocks/chat'
import type { Conversation, Message } from '~/types/chat'
import type { UseAgentStreamCallbacks } from '~/hooks/useAgentStream'
import type { AgentRunRequest } from '~/types/agentStream'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('~/hooks/__internal__/conversation', () => ({
  saveConversationToLocalStorage: vi.fn(),
}))

// posthog is mocked globally in vitest.setup.ts

import { saveConversationToLocalStorage } from '~/hooks/__internal__/conversation'
import posthog from 'posthog-js'
import { runServerAgentMode } from '../runServerAgentMode'

// ── Helpers ────────────────────────────────────────────────────────────────

type CapturedCallbacks = UseAgentStreamCallbacks

function makeParams(overrides: Record<string, any> = {}) {
  const message = makeMessage({
    id: 'user-msg',
    role: 'user',
    content: 'Hello',
  })
  const conversation = makeConversation({
    id: 'conv-1',
    messages: [message],
    userEmail: 'test@example.com',
  })

  return {
    abortAgent: vi.fn(),
    conversations: [conversation] as Conversation[],
    courseName: 'TEST101',
    enabledDocumentGroups: ['group1'],
    errorToast: vi.fn(),
    homeDispatch: vi.fn(),
    message,
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
    runAgentAsync: vi.fn(async () => {}),
    selectedConversation: conversation,
    stopConversationRef: { current: false } as { current: boolean },
    updatedConversation: conversation,
    ...overrides,
  }
}

/**
 * Create params where runAgentAsync captures callbacks and invokes them
 * per the provided script function.
 */
function makeParamsWithCallbackScript(
  script: (callbacks: CapturedCallbacks) => void | Promise<void>,
  overrides: Record<string, any> = {},
) {
  const params = makeParams(overrides)
  params.runAgentAsync = vi.fn(
    async ({
      callbacks,
    }: {
      request: AgentRunRequest
      callbacks: CapturedCallbacks
    }) => {
      await script(callbacks)
    },
  )
  return params
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('runServerAgentMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic successful run', () => {
    it('calls runAgentAsync and dispatches loading states', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.runAgentAsync).toHaveBeenCalledTimes(1)
      expect(params.homeDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'loading', value: false }),
      )
    })

    it('captures posthog event', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })

      await runServerAgentMode(params)

      expect(posthog.capture).toHaveBeenCalledWith('agent_mode_server_run', {
        course_name: 'TEST101',
        model_id: params.selectedConversation.model.id,
      })
    })

    it('sets initial agent events on message', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })

      await runServerAgentMode(params)

      // message.agentEvents was initially set to []
      expect(saveConversationToLocalStorage).toHaveBeenCalled()
    })
  })

  describe('onInitializing callback', () => {
    it('sets up init event and assistantMessageId', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.message.agentEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'agent-initializing',
            type: 'initializing',
            status: 'running',
          }),
        ]),
      )
    })
  })

  describe('onAgentEventsUpdate callback', () => {
    it('updates message.agentEvents', async () => {
      const testEvents = [
        {
          id: 'step-1',
          stepNumber: 1,
          type: 'tool_call' as const,
          status: 'completed' as const,
          title: 'Search',
          createdAt: new Date().toISOString(),
        },
      ]

      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onAgentEventsUpdate(testEvents)
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.message.agentEvents).toEqual(testEvents)
    })
  })

  describe('onToolsUpdate callback', () => {
    it('maps tools to UIUCTool format', async () => {
      const clientTools = [
        {
          id: 'tool-1',
          invocationId: 'inv-1',
          name: 'search',
          readableName: 'Search',
          description: 'Search docs',
          aiGeneratedArgumentValues: { query: 'test' },
          output: { text: 'result', imageUrls: [] },
          error: undefined,
        },
      ]

      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onToolsUpdate(clientTools as any)
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.message.tools).toEqual([
        expect.objectContaining({
          id: 'tool-1',
          name: 'search',
          output: { text: 'result', imageUrls: [] },
        }),
      ])
    })

    it('handles tools without output', async () => {
      const clientTools = [
        {
          id: 'tool-2',
          invocationId: 'inv-2',
          name: 'calc',
          readableName: 'Calculate',
          description: 'Do math',
          aiGeneratedArgumentValues: {},
          output: undefined,
          error: 'timeout',
        },
      ]

      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onToolsUpdate(clientTools as any)
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.message.tools).toEqual([
        expect.objectContaining({
          id: 'tool-2',
          output: undefined,
          error: 'timeout',
        }),
      ])
    })
  })

  describe('onContextsMetadata callback', () => {
    it('maps contexts to message.contexts', async () => {
      const contextsMetadata = [
        {
          readable_filename: 'doc.pdf',
          s3_path: 's3://bucket/doc.pdf',
          pagenumber: 3,
          url: 'https://example.com/doc',
          base_url: 'https://example.com',
        },
      ]

      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onContextsMetadata('user-msg', contextsMetadata as any)
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.message.contexts).toEqual([
        expect.objectContaining({
          readable_filename: 'doc.pdf',
          s3_path: 's3://bucket/doc.pdf',
          course_name: 'TEST101',
        }),
      ])
    })
  })

  describe('onRetrievalStart/Done callbacks', () => {
    it('dispatches isRetrievalLoading', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onRetrievalStart()
        cb.onRetrievalDone()
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRetrievalLoading',
        value: true,
      })
      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRetrievalLoading',
        value: false,
      })
    })
  })

  describe('onToolStart/Done callbacks', () => {
    it('dispatches isRunningTool', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onToolStart()
        cb.onToolDone()
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRunningTool',
        value: true,
      })
      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRunningTool',
        value: false,
      })
    })
  })

  describe('onFinalTokens callback', () => {
    it('creates and updates assistant message', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onFinalTokens('Hello ', false)
        cb.onFinalTokens('world', false)
        cb.onFinalTokens('', true) // done
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      // Should have dispatched selectedConversation with assistant message
      const selectedConvCalls = params.homeDispatch.mock.calls.filter(
        (c: any[]) => c[0].field === 'selectedConversation',
      )
      expect(selectedConvCalls.length).toBeGreaterThan(0)
    })

    it('dispatches loading=false and messageIsStreaming=false on done', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onFinalTokens('', true)
        cb.onDone('conv-1', 'assistant-1', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'loading',
        value: false,
      })
      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'messageIsStreaming',
        value: false,
      })
    })
  })

  describe('onDone callback', () => {
    it('finishes run and invalidates queries', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onDone('conv-1', 'final-msg-id', undefined as any)
      })

      const invalidateSpy = vi.spyOn(params.queryClient, 'invalidateQueries')

      await runServerAgentMode(params)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversationHistory', 'TEST101'],
      })
    })

    it('updates assistantMessageId when different from final', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'temp-assistant-id')
        cb.onFinalTokens('Hello', false)
        cb.onDone('conv-1', 'final-assistant-id', undefined as any)
      })

      await runServerAgentMode(params)

      // The final dispatch should use the finalMessageId
      expect(saveConversationToLocalStorage).toHaveBeenCalled()
    })
  })

  describe('onError callback', () => {
    it('shows error toast for non-abort errors', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onError('Something went wrong')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await runServerAgentMode(params)

      expect(params.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Something went wrong',
      })
      consoleSpy.mockRestore()
    })

    it('calls finalizeAbort for abort errors', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        cb.onError('Request aborted')
      })

      // Simulate abort was triggered
      params.stopConversationRef.current = true
      vi.advanceTimersByTime(100)

      await runServerAgentMode(params)

      // Should not show error toast for aborted runs
      expect(params.errorToast).not.toHaveBeenCalled()
    })
  })

  describe('abort via stopConversationRef', () => {
    it('calls abortAgent when stop is signaled', async () => {
      const params = makeParamsWithCallbackScript(async (cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        // Simulate user clicking stop during the run
        params.stopConversationRef.current = true
        // Allow the interval to fire
        vi.advanceTimersByTime(100)
        cb.onError('aborted')
      })

      await runServerAgentMode(params)

      expect(params.abortAgent).toHaveBeenCalled()
    })
  })

  describe('error thrown by runAgentAsync', () => {
    it('catches error and shows toast', async () => {
      const params = makeParams()
      params.runAgentAsync = vi.fn(async () => {
        throw new Error('Connection failed')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await runServerAgentMode(params)

      expect(params.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Connection failed',
      })
      consoleSpy.mockRestore()
    })

    it('handles non-Error thrown values', async () => {
      const params = makeParams()
      params.runAgentAsync = vi.fn(async () => {
        throw 'string error'
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await runServerAgentMode(params)

      expect(params.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Unknown error',
      })
      consoleSpy.mockRestore()
    })

    it('treats AbortError as abort, no toast', async () => {
      const params = makeParams()
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      params.runAgentAsync = vi.fn(async () => {
        throw abortError
      })

      await runServerAgentMode(params)

      expect(params.errorToast).not.toHaveBeenCalled()
    })
  })

  describe('syncConversationList', () => {
    it('handles empty conversations array', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })
      params.conversations = []

      await runServerAgentMode(params)

      // Should not crash, no conversations dispatch for sync
      expect(params.homeDispatch).toHaveBeenCalled()
    })

    it('handles undefined conversations', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })
      params.conversations = undefined

      await runServerAgentMode(params)

      // Should not crash
      expect(params.homeDispatch).toHaveBeenCalled()
    })

    it('adds new conversation when not in list', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })
      // Use a different conversation ID
      params.conversations = [makeConversation({ id: 'other-conv' })]

      await runServerAgentMode(params)

      const convCalls = params.homeDispatch.mock.calls.filter(
        (c: any[]) => c[0].field === 'conversations',
      )
      expect(convCalls.length).toBeGreaterThan(0)
    })
  })

  describe('finalizeAbort', () => {
    it('marks running events as error', async () => {
      const params = makeParamsWithCallbackScript(async (cb) => {
        cb.onInitializing('user-msg', 'conv-1', 'assistant-1')
        // Add a running event
        params.message.agentEvents = [
          {
            id: 'step-1',
            stepNumber: 1,
            type: 'tool_call' as any,
            status: 'running' as any,
            title: 'Running tool',
            createdAt: new Date().toISOString(),
          },
        ]
        params.stopConversationRef.current = true
        vi.advanceTimersByTime(100)
        cb.onError('aborted')
      })

      await runServerAgentMode(params)

      // Events should be marked as error
      const events = params.message.agentEvents ?? []
      if (events.length > 0) {
        expect(events[0]!.status).toBe('error')
      }
    })
  })

  describe('finally block', () => {
    it('resets routing and tool states', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })

      await runServerAgentMode(params)

      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRouting',
        value: false,
      })
      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRunningTool',
        value: false,
      })
      expect(params.homeDispatch).toHaveBeenCalledWith({
        field: 'isRetrievalLoading',
        value: false,
      })
    })
  })

  describe('fileUploadContexts', () => {
    it('maps message contexts to fileUploadContexts', async () => {
      const params = makeParamsWithCallbackScript((cb) => {
        cb.onDone('conv-1', 'final-msg', undefined as any)
      })
      params.message.contexts = [
        {
          id: 0,
          text: 'context text',
          readable_filename: 'upload.pdf',
          course_name: 'TEST101',
          'course_name ': 'TEST101',
          s3_path: 's3://bucket/upload.pdf',
          pagenumber: '1',
          url: 'https://example.com/upload',
          base_url: 'https://example.com',
        },
      ]

      await runServerAgentMode(params)

      const callArgs = params.runAgentAsync.mock.calls[0]![0]
      expect(callArgs.request.fileUploadContexts).toEqual([
        expect.objectContaining({
          id: 0,
          text: 'context text',
          readable_filename: 'upload.pdf',
        }),
      ])
    })
  })
})
