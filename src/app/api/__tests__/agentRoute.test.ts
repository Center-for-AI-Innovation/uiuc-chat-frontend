import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mocks – declared before any import so vi.mock factories can reference
// ---------------------------------------------------------------------------
const hoisted = vi.hoisted(() => {
  return {
    runAgentConversation: vi.fn(async () => undefined),
    getModels: vi.fn(async () => null as any),
    getCourseMetadata: vi.fn(async () => null as any),
    convertDBToChatConversation: vi.fn((_c: any, _m: any) => ({
      id: 'existing-conv',
      name: 'Test',
      messages: [],
      model: { id: 'gpt-4o', name: 'GPT-4o' },
      prompt: '',
      temperature: 0.7,
      folderId: null,
      userEmail: 'u@example.com',
      projectName: 'CS101',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    dbSelect: vi.fn(),
  }
})

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('~/app/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
  getCourseMetadata: hoisted.getCourseMetadata,
}))

vi.mock('~/server/agent/runAgentConversation', () => ({
  runAgentConversation: hoisted.runAgentConversation,
}))

vi.mock('~/pages/api/models', () => ({
  getModels: hoisted.getModels,
}))

vi.mock('~/pages/api/conversation', () => ({
  convertDBToChatConversation: hoisted.convertDBToChatConversation,
}))

vi.mock('~/utils/modelProviders/WebLLM', () => ({
  webLLMModels: [{ id: 'webllm-test-model', name: 'WebLLM Test' }],
}))

vi.mock('~/utils/modelProviders/LLMProvider', () => ({
  AllSupportedModels: new Set([
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'claude-3', name: 'Claude 3' },
  ]),
  ProviderNames: { OpenAI: 'OpenAI' },
}))

vi.mock('~/db/dbClient', () => {
  const fromFn = vi.fn()
  const whereFn = vi.fn()
  const limitFn = vi.fn()
  const selectFn = vi.fn(() => ({ from: fromFn }))
  fromFn.mockReturnValue({ where: whereFn })
  whereFn.mockReturnValue({ limit: limitFn })
  limitFn.mockResolvedValue([])
  hoisted.dbSelect.mockImplementation(() => {
    // Reset the chain for each call
    limitFn.mockResolvedValue([])
    return { from: fromFn }
  })
  return {
    db: { select: hoisted.dbSelect },
    conversations: { id: 'id' },
    messages: { conversation_id: 'conversation_id' },
  }
})

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => args),
}))

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}))

// ---------------------------------------------------------------------------
// Import the handler under test (POST is the auth-wrapped handler, which in
// our mock is just the raw handler function)
// ---------------------------------------------------------------------------
import { POST } from '../agent/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>): Request {
  const req = new Request('http://localhost/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return req
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    courseName: 'CS101',
    userMessage: { id: 'msg-1', content: 'Hello agent' },
    model: { id: 'gpt-4o', name: 'GPT-4o' },
    temperature: 0.7,
    documentGroups: [],
    ...overrides,
  }
}

/** Read a streaming Response fully and parse SSE events */
async function readSSEEvents(
  response: Response,
): Promise<Array<Record<string, unknown>>> {
  const text = await response.text()
  return text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice(6)))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('app/api/agent POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: metadata found, agent enabled, OpenAI key present
    hoisted.getCourseMetadata.mockResolvedValue({
      agent_mode_enabled: true,
      system_prompt: 'You are helpful.',
      openai_api_key: 'sk-test-key',
    })
    hoisted.getModels.mockResolvedValue({
      OpenAI: { apiKey: 'sk-test-key' },
    })
    hoisted.runAgentConversation.mockResolvedValue(undefined)
  })

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  it('returns 400 when courseName is missing', async () => {
    const req = makeRequest(validBody({ courseName: undefined }))
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('courseName')
  })

  it('returns 400 when userMessage is missing', async () => {
    const req = makeRequest(validBody({ userMessage: undefined }))
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('userMessage')
  })

  it('returns 400 when userMessage has no id', async () => {
    const req = makeRequest(validBody({ userMessage: { content: 'hi' } }))
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('userMessage')
  })

  it('returns 400 when userMessage has no content', async () => {
    const req = makeRequest(validBody({ userMessage: { id: 'msg-1' } }))
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('userMessage')
  })

  it('returns 400 when model.id is missing', async () => {
    const req = makeRequest(validBody({ model: {} }))
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('model.id')
  })

  it('returns 400 for WebLLM model', async () => {
    const req = makeRequest(
      validBody({ model: { id: 'webllm-test-model', name: 'WebLLM Test' } }),
    )
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('WebLLM')
  })

  // -------------------------------------------------------------------------
  // Stream-level errors (emitted as SSE events)
  // -------------------------------------------------------------------------

  it('emits error event when course metadata is not found', async () => {
    hoisted.getCourseMetadata.mockResolvedValue(null)
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    expect(res.status).toBe(200) // streaming response
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toContain('course metadata')
  })

  it('emits error event when agent mode is not enabled', async () => {
    hoisted.getCourseMetadata.mockResolvedValue({
      agent_mode_enabled: false,
      openai_api_key: 'sk-key',
    })
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toContain('Agent Mode is not enabled')
  })

  it('emits error when model not found in AllSupportedModels (null conversation)', async () => {
    const req = makeRequest(
      validBody({ model: { id: 'nonexistent-model', name: 'Nope' } }),
    )
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toContain('conversation')
  })

  it('emits error when no OpenAI key is available', async () => {
    hoisted.getCourseMetadata.mockResolvedValue({
      agent_mode_enabled: true,
    })
    hoisted.getModels.mockResolvedValue(null)
    // Remove env fallback
    const originalEnv = process.env.VLADS_OPENAI_KEY
    delete process.env.VLADS_OPENAI_KEY
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toContain('OpenAI API key')
    process.env.VLADS_OPENAI_KEY = originalEnv
  })

  // -------------------------------------------------------------------------
  // Successful run
  // -------------------------------------------------------------------------

  it('emits initializing event and calls runAgentConversation on success', async () => {
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    const events = await readSSEEvents(res)
    const initEvent = events.find((e) => e.type === 'initializing')
    expect(initEvent).toBeDefined()
    expect(initEvent!.messageId).toBe('msg-1')
    expect(initEvent!.assistantMessageId).toBe('mock-uuid')

    expect(hoisted.runAgentConversation).toHaveBeenCalledOnce()
    const callArgs = hoisted.runAgentConversation.mock.calls[0]![0]
    expect(callArgs.courseName).toBe('CS101')
    expect(callArgs.openaiKey).toBe('sk-test-key')
    expect(callArgs.conversation.agentModeEnabled).toBe(true)
  })

  it('passes array content through for userMessage', async () => {
    const arrayContent = [
      { type: 'text', text: 'Hello' },
      { type: 'image_url', image_url: { url: 'http://img.png' } },
    ]
    const req = makeRequest(
      validBody({ userMessage: { id: 'msg-2', content: arrayContent } }),
    )
    const res = await POST(req as any)
    await readSSEEvents(res) // consume stream

    const callArgs = hoisted.runAgentConversation.mock.calls[0]![0]
    expect(Array.isArray(callArgs.userMessage.content)).toBe(true)
    expect(callArgs.userMessage.content).toHaveLength(2)
    expect(callArgs.userMessage.content[0].type).toBe('text')
  })

  it('passes fileUploadContexts through as message contexts', async () => {
    const fileUploadContexts = [
      {
        id: 1,
        text: 'file content',
        readable_filename: 'test.pdf',
        s3_path: 's3://bucket/test.pdf',
        url: 'https://example.com/test.pdf',
      },
    ]
    const req = makeRequest(validBody({ fileUploadContexts }))
    const res = await POST(req as any)
    await readSSEEvents(res)

    const callArgs = hoisted.runAgentConversation.mock.calls[0]![0]
    expect(callArgs.userMessage.contexts).toHaveLength(1)
    expect(callArgs.userMessage.contexts[0].readable_filename).toBe('test.pdf')
    expect(callArgs.userMessage.contexts[0].course_name).toBe('CS101')
  })

  it('uses OpenAI key from providers when available', async () => {
    hoisted.getModels.mockResolvedValue({
      OpenAI: { apiKey: 'sk-provider-key' },
    })
    hoisted.getCourseMetadata.mockResolvedValue({
      agent_mode_enabled: true,
      openai_api_key: 'sk-metadata-key',
    })
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    await readSSEEvents(res)

    const callArgs = hoisted.runAgentConversation.mock.calls[0]![0]
    expect(callArgs.openaiKey).toBe('sk-provider-key')
  })

  it('falls back to course metadata OpenAI key when providers lack one', async () => {
    hoisted.getModels.mockResolvedValue({})
    hoisted.getCourseMetadata.mockResolvedValue({
      agent_mode_enabled: true,
      openai_api_key: 'sk-metadata-key',
    })
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    await readSSEEvents(res)

    const callArgs = hoisted.runAgentConversation.mock.calls[0]![0]
    expect(callArgs.openaiKey).toBe('sk-metadata-key')
  })

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it('emits error event when runAgentConversation throws', async () => {
    hoisted.runAgentConversation.mockRejectedValueOnce(new Error('Agent boom'))
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toBe('Agent boom')
  })

  it('emits unknown error when non-Error is thrown', async () => {
    hoisted.runAgentConversation.mockRejectedValueOnce('string-error')
    const req = makeRequest(validBody())
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const errorEvent = events.find((e) => e.type === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.message).toBe('Unknown error')
  })

  it('returns 500 JSON when req.json() throws', async () => {
    // Create a request whose json() will throw
    const badReq = {
      json: () => Promise.reject(new Error('Bad JSON')),
      signal: new AbortController().signal,
    }
    const res = await POST(badReq as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Bad JSON')
  })

  // -------------------------------------------------------------------------
  // Existing conversation fetch
  // -------------------------------------------------------------------------

  it('fetches existing conversation from DB when conversationId provided', async () => {
    // Setup DB chain to return a conversation
    const fromFn = vi.fn()
    const whereFn = vi.fn()
    const limitFn = vi.fn()

    hoisted.dbSelect.mockImplementation(() => ({ from: fromFn }))

    let callCount = 0
    fromFn.mockImplementation(() => {
      callCount++
      return { where: whereFn }
    })
    whereFn.mockImplementation(() => {
      if (callCount === 1) {
        // First call: select conversations
        return { limit: limitFn }
      }
      // Second call: select messages (no limit)
      return Promise.resolve([])
    })
    limitFn.mockResolvedValue([{ id: 'conv-123', name: 'Existing' }])

    hoisted.convertDBToChatConversation.mockReturnValue({
      id: 'conv-123',
      name: 'Existing',
      messages: [],
      model: { id: 'gpt-4o', name: 'GPT-4o' },
      prompt: '',
      temperature: 0.7,
      folderId: null,
      userEmail: 'u@example.com',
      projectName: 'CS101',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const req = makeRequest(validBody({ conversationId: 'conv-123' }))
    const res = await POST(req as any)
    const events = await readSSEEvents(res)
    const initEvent = events.find((e) => e.type === 'initializing')
    expect(initEvent).toBeDefined()
    expect(initEvent!.conversationId).toBe('conv-123')
  })
})
