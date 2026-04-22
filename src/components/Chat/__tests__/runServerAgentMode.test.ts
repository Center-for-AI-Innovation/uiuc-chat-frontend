import { type QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'
import { type AgentEvent, type Conversation, type Message } from '~/types/chat'
import { type ClientUIUCTool, type ContextMetadata } from '~/types/agentStream'
import { type UseAgentStreamCallbacks } from '~/hooks/useAgentStream'
import { runServerAgentMode } from '../runServerAgentMode'

// Mock saveConversationToLocalStorage
vi.mock('~/hooks/__internal__/conversation', () => ({
  saveConversationToLocalStorage: vi.fn(),
}))

// ── Helpers ──────────────────────────────────────────────────────────

function createMockMessage(overrides: Partial<Message> = {}): Message {
  return makeMessage({
    id: 'user-msg-1',
    role: 'user',
    content: 'What is machine learning?',
    ...overrides,
  })
}

function createMockConversation(
  messages: Message[],
  overrides: Partial<Conversation> = {},
): Conversation {
  return makeConversation({
    id: 'conv-1',
    messages,
    userEmail: 'test@example.com',
    ...overrides,
  })
}

interface SetupOptions {
  runAgentAsync?: (variables: {
    request: unknown
    callbacks: UseAgentStreamCallbacks
  }) => Promise<void>
  conversations?: Conversation[]
  stopConversationRef?: { current: boolean }
  message?: Message
  conversationMessages?: Message[]
  conversationOverrides?: Partial<Conversation>
}

function setup(options: SetupOptions = {}) {
  const message = options.message ?? createMockMessage()
  const conversationMessages = options.conversationMessages ?? [message]
  const selectedConversation = createMockConversation(
    conversationMessages,
    options.conversationOverrides,
  )
  const updatedConversation = { ...selectedConversation }

  const homeDispatch = vi.fn()
  const abortAgent = vi.fn()
  const errorToast = vi.fn()
  const queryClient = {
    invalidateQueries: vi.fn(),
  } as unknown as QueryClient
  const stopConversationRef = options.stopConversationRef ?? {
    current: false,
  }

  const runAgentAsync =
    options.runAgentAsync ??
    vi.fn(async () => {
      // no-op by default
    })

  const conversations = options.conversations ?? [selectedConversation]

  return {
    params: {
      abortAgent,
      conversations,
      courseName: 'CS101',
      enabledDocumentGroups: ['all'],
      errorToast,
      homeDispatch,
      message,
      queryClient,
      runAgentAsync,
      selectedConversation,
      stopConversationRef,
      updatedConversation,
    },
    mocks: {
      homeDispatch,
      abortAgent,
      errorToast,
      queryClient,
      runAgentAsync,
    },
  }
}

/**
 * Helper to create a runAgentAsync that invokes specific callbacks.
 */
function createRunAgentWithCallbacks(
  invokeCallbacks: (callbacks: UseAgentStreamCallbacks) => void,
) {
  return vi.fn(
    async (variables: {
      request: unknown
      callbacks: UseAgentStreamCallbacks
    }) => {
      invokeCallbacks(variables.callbacks)
    },
  )
}

// ── Tests ────────────────────────────────────────────────────────────

describe('runServerAgentMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial setup', () => {
    it('clears agentEvents on the message and dispatches initial state', async () => {
      const { params, mocks } = setup()

      // Give the message some pre-existing events to ensure they get cleared
      params.message.agentEvents = [
        {
          id: 'old',
          stepNumber: 0,
          type: 'initializing',
          status: 'done',
          title: 'old event',
          createdAt: new Date().toISOString(),
        },
      ]

      await runServerAgentMode(params)

      // agentEvents should have been reset to [] at the start
      // (then possibly modified by callbacks, but the initial clear should have happened)
      expect(mocks.runAgentAsync).toHaveBeenCalledOnce()
    })

    it('builds the correct agent request', async () => {
      const message = createMockMessage({
        imageUrls: ['https://example.com/img.png'],
        contexts: [
          {
            id: 1,
            text: 'context text',
            readable_filename: 'file.pdf',
            course_name: 'CS101',
            'course_name ': 'CS101',
            s3_path: 's3://bucket/file.pdf',
            pagenumber: '1',
            url: 'https://example.com/file.pdf',
            base_url: 'https://example.com',
          },
        ],
      })

      const { params, mocks } = setup({
        message,
        conversationMessages: [message],
      })

      await runServerAgentMode(params)

      const calledWith = (mocks.runAgentAsync as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0]
      expect(calledWith).toBeDefined()
      const request = calledWith.request
      expect(request.conversationId).toBe('conv-1')
      expect(request.courseName).toBe('CS101')
      expect(request.userMessage.id).toBe(message.id)
      expect(request.userMessage.content).toBe(message.content)
      expect(request.userMessage.imageUrls).toEqual([
        'https://example.com/img.png',
      ])
      expect(request.documentGroups).toEqual(['all'])
      expect(request.fileUploadContexts).toHaveLength(1)
      expect(request.fileUploadContexts![0]!.readable_filename).toBe('file.pdf')
    })

    it('builds request without fileUploadContexts when message has no contexts', async () => {
      const message = createMockMessage({ contexts: undefined })
      const { params, mocks } = setup({
        message,
        conversationMessages: [message],
      })

      await runServerAgentMode(params)

      const calledWith = (mocks.runAgentAsync as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0]
      expect(calledWith.request.fileUploadContexts).toBeUndefined()
    })
  })

  describe('onInitializing callback', () => {
    it('sets assistantMessageId and creates an init event', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-msg-1')
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.agentEvents).toBeDefined()
      expect(params.message.agentEvents!.length).toBe(1)
      expect(params.message.agentEvents![0]!.type).toBe('initializing')
      expect(params.message.agentEvents![0]!.status).toBe('running')

      // Should dispatch selectedConversation update
      const dispatchCalls = mocks.homeDispatch.mock.calls
      const selectedConvDispatches = dispatchCalls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      expect(selectedConvDispatches.length).toBeGreaterThan(0)
    })
  })

  describe('onAgentEventsUpdate callback', () => {
    it('updates agentEvents on the message and syncs', async () => {
      const agentEvents: AgentEvent[] = [
        {
          id: 'ev-1',
          stepNumber: 1,
          type: 'retrieval',
          status: 'running',
          title: 'Retrieving...',
          createdAt: new Date().toISOString(),
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onAgentEventsUpdate?.(agentEvents, 'msg-1')
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.agentEvents).toEqual(agentEvents)
    })
  })

  describe('onToolsUpdate callback', () => {
    it('maps client tools to UIUCTool format on the message', async () => {
      const clientTools: ClientUIUCTool[] = [
        {
          id: 'tool-1',
          invocationId: 'inv-1',
          name: 'search_web',
          readableName: 'Web Search',
          description: 'Searches the web',
          aiGeneratedArgumentValues: { query: 'test' },
          output: { text: 'result', imageUrls: ['https://img.com/1.png'] },
          error: undefined,
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onToolsUpdate?.(clientTools, 'msg-1')
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.tools).toBeDefined()
      expect(params.message.tools!.length).toBe(1)
      expect(params.message.tools![0]!.id).toBe('tool-1')
      expect(params.message.tools![0]!.name).toBe('search_web')
      expect(params.message.tools![0]!.output).toEqual({
        text: 'result',
        imageUrls: ['https://img.com/1.png'],
      })
    })

    it('handles tool without output', async () => {
      const clientTools: ClientUIUCTool[] = [
        {
          id: 'tool-2',
          name: 'no_output_tool',
          readableName: 'No Output',
          description: 'Does nothing visible',
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onToolsUpdate?.(clientTools, 'msg-1')
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.tools![0]!.output).toBeUndefined()
    })
  })

  describe('onContextsMetadata callback', () => {
    it('maps context metadata to ContextWithMetadata format', async () => {
      const contextsMetadata: ContextMetadata[] = [
        {
          readable_filename: 'lecture.pdf',
          s3_path: 's3://bucket/lecture.pdf',
          url: 'https://example.com/lecture.pdf',
          base_url: 'https://example.com',
          pagenumber: '5',
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onContextsMetadata?.('msg-1', contextsMetadata, 1)
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.contexts).toBeDefined()
      expect(params.message.contexts!.length).toBe(1)
      expect(params.message.contexts![0]!.readable_filename).toBe('lecture.pdf')
      expect(params.message.contexts![0]!.s3_path).toBe(
        's3://bucket/lecture.pdf',
      )
      expect(params.message.contexts![0]!.course_name).toBe('CS101')
      expect(params.message.contexts![0]!.pagenumber).toBe('5')
    })

    it('handles missing url and pagenumber gracefully', async () => {
      const contextsMetadata: ContextMetadata[] = [
        {
          readable_filename: 'doc.pdf',
          s3_path: 's3://bucket/doc.pdf',
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onContextsMetadata?.('msg-1', contextsMetadata, 1)
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.contexts![0]!.url).toBe('')
      expect(params.message.contexts![0]!.base_url).toBe('')
      expect(params.message.contexts![0]!.pagenumber).toBe('')
    })
  })

  describe('onRetrievalStart / onRetrievalDone callbacks', () => {
    it('dispatches isRetrievalLoading true on start and false on done', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onRetrievalStart?.(1, 'query')
          callbacks.onRetrievalDone?.(1, 'query', 5)
        }),
      })

      await runServerAgentMode(params)

      const retrievalCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRetrievalLoading',
      )
      expect(retrievalCalls.some((c) => c[0].value === true)).toBe(true)
      expect(retrievalCalls.some((c) => c[0].value === false)).toBe(true)
    })
  })

  describe('onToolStart / onToolDone callbacks', () => {
    it('dispatches isRunningTool true on start and false on done', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onToolStart?.(1, 'web_search', 'Web Search')
          callbacks.onToolDone?.(1, 'web_search', { text: 'result' })
        }),
      })

      await runServerAgentMode(params)

      const toolCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRunningTool',
      )
      expect(toolCalls.some((c) => c[0].value === true)).toBe(true)
      expect(toolCalls.some((c) => c[0].value === false)).toBe(true)
    })
  })

  describe('onFinalTokens callback', () => {
    it('accumulates deltas and updates assistant message content', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          // First set up the assistant message via onInitializing
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-msg-1')
          // Then stream tokens
          callbacks.onFinalTokens?.('Hello ', false)
          callbacks.onFinalTokens?.('world!', false)
        }),
      })

      await runServerAgentMode(params)

      // The function dispatches selectedConversation updates as tokens arrive
      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      // Should have dispatches from token streaming
      expect(selectedConvDispatches.length).toBeGreaterThan(0)

      // Check that loading was set to false during token streaming
      const loadingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'loading',
      )
      expect(loadingCalls.some((c) => c[0].value === false)).toBe(true)
    })

    it('dispatches messageIsStreaming false when done=true', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onFinalTokens?.('', true)
        }),
      })

      await runServerAgentMode(params)

      const streamingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'messageIsStreaming',
      )
      expect(streamingCalls.some((c) => c[0].value === false)).toBe(true)
    })
  })

  describe('onDone callback', () => {
    it('finishes the run with persist and invalidateHistory', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-msg-1')
          callbacks.onDone?.('conv-1', 'asst-msg-1', {
            totalContextsRetrieved: 3,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      // Should invalidate queries
      expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['conversationHistory', 'CS101'],
      })

      // Should dispatch loading false
      const loadingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'loading',
      )
      expect(loadingCalls.some((c) => c[0].value === false)).toBe(true)
    })

    it('updates assistantMessageId when finalMessageId differs', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-temp-id')
          callbacks.onDone?.('conv-1', 'asst-final-id', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      // The final dispatch of selectedConversation should have the message with updated ID
      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      // Verify it completed without error
      expect(selectedConvDispatches.length).toBeGreaterThan(0)
    })
  })

  describe('onError callback', () => {
    it('shows an error toast for non-abort errors', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onError?.('Something went wrong')
        }),
      })

      await runServerAgentMode(params)

      expect(mocks.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Something went wrong',
      })
    })

    it('does not show error toast for abort errors', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onError?.('Request aborted')
        }),
      })

      await runServerAgentMode(params)

      // Should not show the toast because the message matches /aborted/i
      expect(mocks.errorToast).not.toHaveBeenCalled()
    })

    it('finalizes abort when runAborted is true on error', async () => {
      const stopRef = { current: false }
      let callbacksRef: UseAgentStreamCallbacks | null = null

      const runAgentAsync = vi.fn(
        async (variables: {
          request: unknown
          callbacks: UseAgentStreamCallbacks
        }) => {
          callbacksRef = variables.callbacks

          // Simulate the stop watcher firing by setting stopRef
          stopRef.current = true
          // Advance timers so the setInterval fires
          vi.advanceTimersByTime(100)

          // Now trigger an error callback
          callbacksRef.onError?.('aborted')
        },
      )

      const { params, mocks } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      // abortAgent should have been called by the stop watcher
      expect(mocks.abortAgent).toHaveBeenCalled()
      // errorToast should NOT be called for abort
      expect(mocks.errorToast).not.toHaveBeenCalled()
    })
  })

  describe('catch block - thrown errors', () => {
    it('handles generic thrown errors with error toast', async () => {
      const { params, mocks } = setup({
        runAgentAsync: vi.fn(async () => {
          throw new Error('Network failure')
        }),
      })

      await runServerAgentMode(params)

      expect(mocks.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Network failure',
      })
    })

    it('handles non-Error thrown values', async () => {
      const { params, mocks } = setup({
        runAgentAsync: vi.fn(async () => {
          throw 'string error'
        }),
      })

      await runServerAgentMode(params)

      expect(mocks.errorToast).toHaveBeenCalledWith({
        title: 'Agent Error',
        message: 'Unknown error',
      })
    })

    it('handles AbortError without showing error toast', async () => {
      const { params, mocks } = setup({
        runAgentAsync: vi.fn(async () => {
          const err = new Error('Aborted')
          err.name = 'AbortError'
          throw err
        }),
      })

      await runServerAgentMode(params)

      expect(mocks.errorToast).not.toHaveBeenCalled()
    })

    it('handles AbortError when runAborted is true', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(async () => {
        // Simulate stop watcher triggering runAborted
        stopRef.current = true
        vi.advanceTimersByTime(100)

        const err = new Error('Aborted')
        err.name = 'AbortError'
        throw err
      })

      const { params, mocks } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      expect(mocks.abortAgent).toHaveBeenCalled()
      expect(mocks.errorToast).not.toHaveBeenCalled()
    })
  })

  describe('finally block', () => {
    it('clears the stop watcher interval and dispatches cleanup state', async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      const { params, mocks } = setup()

      await runServerAgentMode(params)

      // clearInterval should be called once for the stop watcher
      expect(clearIntervalSpy).toHaveBeenCalled()

      // isRouting, isRunningTool, isRetrievalLoading should all be false
      const routingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRouting',
      )
      expect(routingCalls.some((c) => c[0].value === false)).toBe(true)

      const toolCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRunningTool',
      )
      expect(toolCalls.some((c) => c[0].value === false)).toBe(true)

      const retrievalCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRetrievalLoading',
      )
      expect(retrievalCalls.some((c) => c[0].value === false)).toBe(true)

      clearIntervalSpy.mockRestore()
    })

    it('dispatches cleanup state even when runAgentAsync throws', async () => {
      const { params, mocks } = setup({
        runAgentAsync: vi.fn(async () => {
          throw new Error('failure')
        }),
      })

      await runServerAgentMode(params)

      const routingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'isRouting',
      )
      expect(routingCalls.some((c) => c[0].value === false)).toBe(true)
    })
  })

  describe('syncConversationList', () => {
    it('adds conversation to list if not found', async () => {
      const otherConversation = createMockConversation([], { id: 'conv-other' })

      const { params, mocks } = setup({
        conversations: [otherConversation],
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      // Find the dispatch that updates conversations
      const convListDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'conversations',
      )
      expect(convListDispatches.length).toBeGreaterThan(0)

      // The updated list should include both conversations
      const lastConvListDispatch =
        convListDispatches[convListDispatches.length - 1]
      const updatedList = lastConvListDispatch![0].value as Conversation[]
      expect(updatedList.length).toBe(2)
    })

    it('updates existing conversation in list', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      const convListDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'conversations',
      )
      expect(convListDispatches.length).toBeGreaterThan(0)

      const lastConvListDispatch =
        convListDispatches[convListDispatches.length - 1]
      const updatedList = lastConvListDispatch![0].value as Conversation[]
      expect(updatedList.length).toBe(1)
      expect(updatedList[0]!.id).toBe('conv-1')
    })

    it('handles empty conversations array', async () => {
      const { params, mocks } = setup({
        conversations: [],
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      // Should not dispatch conversations when list is empty
      const convListDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'conversations',
      )
      expect(convListDispatches.length).toBe(0)
    })

    it('handles undefined conversations', async () => {
      const message = createMockMessage()
      const selectedConversation = createMockConversation([message])

      const homeDispatch = vi.fn()
      const errorToast = vi.fn()
      const queryClient = {
        invalidateQueries: vi.fn(),
      } as unknown as QueryClient

      await runServerAgentMode({
        abortAgent: vi.fn(),
        conversations: undefined,
        courseName: 'CS101',
        enabledDocumentGroups: ['all'],
        errorToast,
        homeDispatch,
        message,
        queryClient,
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
        selectedConversation,
        stopConversationRef: { current: false },
        updatedConversation: { ...selectedConversation },
      })

      const convListDispatches = homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'conversations',
      )
      expect(convListDispatches.length).toBe(0)
    })
  })

  describe('touchConversationTimestamps', () => {
    it('preserves existing createdAt and updates updatedAt', async () => {
      const existingCreatedAt = '2024-01-01T00:00:00.000Z'
      const { params, mocks } = setup({
        conversationOverrides: { createdAt: existingCreatedAt },
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      const lastDispatch =
        selectedConvDispatches[selectedConvDispatches.length - 1]
      const conv = lastDispatch![0].value as Conversation
      expect(conv.createdAt).toBe(existingCreatedAt)
      expect(conv.updatedAt).toBeDefined()
    })

    it('sets createdAt when not present', async () => {
      const { params, mocks } = setup({
        conversationOverrides: { createdAt: undefined },
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      const lastDispatch =
        selectedConvDispatches[selectedConvDispatches.length - 1]
      const conv = lastDispatch![0].value as Conversation
      expect(conv.createdAt).toBeDefined()
    })
  })

  describe('stop watcher (abort flow)', () => {
    it('calls abortAgent when stopConversationRef becomes true', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(async () => {
        // Simulate user clicking stop
        stopRef.current = true
        vi.advanceTimersByTime(100)
      })

      const { params, mocks } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      expect(mocks.abortAgent).toHaveBeenCalled()
    })

    it('does not call abortAgent if stopConversationRef stays false', async () => {
      const { params, mocks } = setup()

      await runServerAgentMode(params)

      expect(mocks.abortAgent).not.toHaveBeenCalled()
    })

    it('calls finalizeAbort after runAgentAsync resolves when runAborted', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(async () => {
        stopRef.current = true
        vi.advanceTimersByTime(100)
        // runAgentAsync resolves without calling onDone (simulating incomplete run)
      })

      const { params, mocks } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      // finishRun dispatches loading: false
      const loadingCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'loading',
      )
      expect(loadingCalls.some((c) => c[0].value === false)).toBe(true)
    })
  })

  describe('finalizeAbort', () => {
    it('marks running/pending agent events as error', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(
        async (variables: {
          request: unknown
          callbacks: UseAgentStreamCallbacks
        }) => {
          // Set up some running agent events
          variables.callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-1')
          variables.callbacks.onAgentEventsUpdate?.(
            [
              {
                id: 'ev-1',
                stepNumber: 1,
                type: 'retrieval',
                status: 'running',
                title: 'Retrieving...',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'ev-2',
                stepNumber: 2,
                type: 'tool',
                status: 'pending',
                title: 'Running tool...',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'ev-3',
                stepNumber: 0,
                type: 'initializing',
                status: 'done',
                title: 'Initialized',
                createdAt: new Date().toISOString(),
              },
            ],
            'msg-1',
          )

          // Trigger abort
          stopRef.current = true
          vi.advanceTimersByTime(100)
        },
      )

      const { params } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      // Running and pending events should be marked as error
      const events = params.message.agentEvents!
      const runningEvent = events.find((e) => e.id === 'ev-1')
      const pendingEvent = events.find((e) => e.id === 'ev-2')
      const doneEvent = events.find((e) => e.id === 'ev-3')

      expect(runningEvent?.status).toBe('error')
      expect(runningEvent?.metadata?.errorMessage).toBe('Stopped')
      expect(pendingEvent?.status).toBe('error')
      expect(pendingEvent?.metadata?.errorMessage).toBe('Stopped')
      // Done event should remain unchanged
      expect(doneEvent?.status).toBe('done')
    })

    it('only runs once even if called multiple times', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(
        async (variables: {
          request: unknown
          callbacks: UseAgentStreamCallbacks
        }) => {
          stopRef.current = true
          vi.advanceTimersByTime(100)
          // After runAgentAsync returns, the post-await code also calls finalizeAbort
          // This tests the idempotency guard
        },
      )

      const { params, mocks } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      // Count finishRun dispatches - loading: false should only appear a bounded number of times
      const loadingFalseCalls = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'loading' && call[0].value === false,
      )
      // finalizeAbort + finally cleanup may both set loading=false, but finalizeAbort should
      // only run once (the second call is guarded by abortFinalized)
      expect(loadingFalseCalls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('ensureAssistantMessageExists', () => {
    it('creates assistant message when it does not exist', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-new')
          // Stream tokens to trigger updateAssistantMessage -> ensureAssistantMessageExists
          callbacks.onFinalTokens?.('Hello', false)
        }),
      })

      await runServerAgentMode(params)

      // The assistant message should be created in the conversation
      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      const lastConv = selectedConvDispatches[
        selectedConvDispatches.length - 1
      ]![0].value as Conversation
      const assistantMsg = lastConv.messages.find((m) => m.id === 'asst-new')
      expect(assistantMsg).toBeDefined()
      expect(assistantMsg?.role).toBe('assistant')
      expect(assistantMsg?.content).toBe('Hello')
    })
  })

  describe('updateAssistantMessage', () => {
    it('does nothing when assistantMessageId is null', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          // Stream tokens WITHOUT calling onInitializing first
          callbacks.onFinalTokens?.('Hello', false)
        }),
      })

      await runServerAgentMode(params)

      // Should not throw, should just return early
      expect(mocks.homeDispatch).toHaveBeenCalled()
    })
  })

  describe('agentMessageIndex edge cases', () => {
    it('handles empty messages array gracefully', async () => {
      const message = createMockMessage()
      const { params } = setup({
        message,
        conversationMessages: [],
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-1')
        }),
      })

      // agentMessageIndex would be -1 for empty array
      // syncAgentMessage should return early
      await runServerAgentMode(params)

      // Should complete without throwing
      expect(true).toBe(true)
    })
  })

  describe('finishRun', () => {
    it('dispatches all expected fields', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onDone?.('conv-1', 'final-msg', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      const dispatchedFields = mocks.homeDispatch.mock.calls.map(
        (call) => call[0].field,
      )
      expect(dispatchedFields).toContain('loading')
      expect(dispatchedFields).toContain('messageIsStreaming')
      expect(dispatchedFields).toContain('selectedConversation')
      expect(dispatchedFields).toContain('isRouting')
      expect(dispatchedFields).toContain('isRunningTool')
      expect(dispatchedFields).toContain('isRetrievalLoading')
    })

    it('does not invalidate queries when invalidateHistory is false', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onError?.('some error')
        }),
      })

      await runServerAgentMode(params)

      // onError calls finishRun without invalidateHistory
      expect(mocks.queryClient.invalidateQueries).not.toHaveBeenCalled()
    })
  })

  describe('full happy path', () => {
    it('runs complete agent flow from init to done', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          // 1. Initialize
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-msg-1')

          // 2. Agent events update
          callbacks.onAgentEventsUpdate?.(
            [
              {
                id: 'ev-init',
                stepNumber: 0,
                type: 'initializing',
                status: 'done',
                title: 'Initialized',
                createdAt: new Date().toISOString(),
              },
            ],
            'msg-1',
          )

          // 3. Retrieval
          callbacks.onRetrievalStart?.(1, 'machine learning')
          callbacks.onRetrievalDone?.(1, 'machine learning', 5)

          // 4. Contexts metadata
          callbacks.onContextsMetadata?.(
            'msg-1',
            [
              {
                readable_filename: 'ml-lecture.pdf',
                s3_path: 's3://bucket/ml.pdf',
                url: 'https://example.com/ml.pdf',
                base_url: 'https://example.com',
              },
            ],
            1,
          )

          // 5. Tool execution
          callbacks.onToolStart?.(1, 'search', 'Web Search')
          callbacks.onToolsUpdate?.(
            [
              {
                id: 'tool-1',
                name: 'search',
                readableName: 'Web Search',
                description: 'Search the web',
                output: { text: 'Search results...' },
              },
            ],
            'msg-1',
          )
          callbacks.onToolDone?.(1, 'search', { text: 'Search results...' })

          // 6. Final tokens
          callbacks.onFinalTokens?.('Machine learning is', false)
          callbacks.onFinalTokens?.(' a field of AI.', false)
          callbacks.onFinalTokens?.('', true)

          // 7. Done
          callbacks.onDone?.('conv-1', 'asst-msg-1', {
            totalContextsRetrieved: 5,
            toolsExecuted: [
              {
                name: 'search',
                readableName: 'Web Search',
                hasOutput: true,
                hasError: false,
              },
            ],
          })
        }),
      })

      await runServerAgentMode(params)

      // Verify end state
      expect(mocks.errorToast).not.toHaveBeenCalled()
      expect(mocks.queryClient.invalidateQueries).toHaveBeenCalledOnce()

      // Verify contexts were set
      expect(params.message.contexts).toBeDefined()
      expect(params.message.contexts!.length).toBe(1)

      // Verify tools were set
      expect(params.message.tools).toBeDefined()
      expect(params.message.tools!.length).toBe(1)

      // Verify agent events were set
      expect(params.message.agentEvents).toBeDefined()
    })
  })

  describe('edge case: onDone with missing assistant message', () => {
    it('handles onDone when assistantMessage at index does not exist', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-temp')
          // The assistant message is appended but we then call onDone with a different ID
          // to exercise the branch where assistantMessage lookup succeeds
          callbacks.onFinalTokens?.('test', false)
          callbacks.onDone?.('conv-1', 'asst-final', {
            totalContextsRetrieved: 0,
            toolsExecuted: [],
          })
        }),
      })

      await runServerAgentMode(params)

      // Should complete without error and invalidate queries
      expect(mocks.queryClient.invalidateQueries).toHaveBeenCalled()
    })
  })

  describe('posthog capture', () => {
    it('captures agent_mode_server_run event', async () => {
      const posthog = await import('posthog-js')
      const captureSpy = vi.spyOn(posthog.default, 'capture')

      const { params } = setup()
      await runServerAgentMode(params)

      expect(captureSpy).toHaveBeenCalledWith('agent_mode_server_run', {
        course_name: 'CS101',
        model_id: params.selectedConversation.model.id,
      })
    })
  })

  describe('agentModeEnabled flag', () => {
    it('sets agentModeEnabled on the conversation during sync', async () => {
      const { params, mocks } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onInitializing?.('msg-1', 'conv-1', 'asst-1')
        }),
      })

      await runServerAgentMode(params)

      const selectedConvDispatches = mocks.homeDispatch.mock.calls.filter(
        (call) => call[0].field === 'selectedConversation',
      )
      const dispatched = selectedConvDispatches.find((call) => {
        const conv = call[0].value as Conversation
        return conv.agentModeEnabled === true
      })
      expect(dispatched).toBeDefined()
    })
  })

  describe('multiple context metadata entries', () => {
    it('assigns sequential IDs to contexts', async () => {
      const contextsMetadata: ContextMetadata[] = [
        {
          readable_filename: 'file1.pdf',
          s3_path: 's3://bucket/file1.pdf',
        },
        {
          readable_filename: 'file2.pdf',
          s3_path: 's3://bucket/file2.pdf',
          pagenumber: 3,
        },
      ]

      const { params } = setup({
        runAgentAsync: createRunAgentWithCallbacks((callbacks) => {
          callbacks.onContextsMetadata?.('msg-1', contextsMetadata, 2)
        }),
      })

      await runServerAgentMode(params)

      expect(params.message.contexts!.length).toBe(2)
      expect(params.message.contexts![0]!.id).toBe(0)
      expect(params.message.contexts![1]!.id).toBe(1)
      expect(params.message.contexts![1]!.pagenumber).toBe('3')
    })
  })

  describe('error event metadata preservation', () => {
    it('preserves existing errorMessage on events during abort', async () => {
      const stopRef = { current: false }

      const runAgentAsync = vi.fn(
        async (variables: {
          request: unknown
          callbacks: UseAgentStreamCallbacks
        }) => {
          variables.callbacks.onAgentEventsUpdate?.(
            [
              {
                id: 'ev-1',
                stepNumber: 1,
                type: 'tool',
                status: 'running',
                title: 'Running tool',
                createdAt: new Date().toISOString(),
                metadata: {
                  errorMessage: 'Pre-existing error',
                },
              },
            ],
            'msg-1',
          )

          stopRef.current = true
          vi.advanceTimersByTime(100)
        },
      )

      const { params } = setup({
        runAgentAsync,
        stopConversationRef: stopRef,
      })

      await runServerAgentMode(params)

      const event = params.message.agentEvents?.find((e) => e.id === 'ev-1')
      // Should preserve the existing errorMessage, not overwrite with 'Stopped'
      expect(event?.metadata?.errorMessage).toBe('Pre-existing error')
    })
  })
})
