/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: vi.fn(() => undefined),
}))

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}))

describe('handleFunctionCalling (node)', () => {
  it('fetchSimTools returns [] when course_name is missing', async () => {
    const { fetchSimTools } = await import('../handleFunctionCalling')
    await expect(fetchSimTools()).resolves.toEqual([])
  })

  it('fetchSimTools returns [] when no api_key/workspace_id in localStorage (server-side)', async () => {
    const { fetchSimTools } = await import('../handleFunctionCalling')
    // In node env, typeof window === 'undefined', so localStorage is not accessed
    await expect(fetchSimTools('proj')).resolves.toEqual([])
  })

  it('handleToolCall skips tools missing invocationId', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const tool: any = {
      id: 'w1',
      name: 't',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: { a: 1 },
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: [tool] }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].output).toBeUndefined()
  })

  it('handleToolCall skips when last message has no tools array', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 't',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: { a: 1 },
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools).toBeUndefined()
  })

  it('handleToolCall skips when invocationId not found in last message tools', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 't',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: { a: 1 },
    }
    const conversation: any = {
      id: 'c1',
      messages: [
        {
          id: 'm1',
          role: 'user',
          content: 'hi',
          tools: [{ ...tool, invocationId: 'other' }],
        },
      ],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].output).toBeUndefined()
  })

  it('handleToolCall sets error when callSimFunction throws (no api key on server)', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 't',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: { a: 1 },
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: [tool] }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].error).toMatch(/Error running tool/i)
  })

  it('handleToolCall populates tool output via runSimWorkflow on success', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')

    const storage: Record<string, string> = { sim_api_key_proj: 'sk-sim-test' }
    const mockLocalStorage = { getItem: (k: string) => storage[k] ?? null }
    vi.stubGlobal('window', { localStorage: mockLocalStorage })
    vi.stubGlobal('localStorage', mockLocalStorage)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, output: 'hello' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 'sim_t',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: { a: 1 },
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: [tool] }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].output).toEqual({ text: 'hello' })

    vi.unstubAllGlobals()
  })

  it('handleToolCall sets error when runSimWorkflow returns success=false', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => {
          if (key === 'sim_api_key_proj') return 'sk-sim-test'
          return null
        },
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: 'workflow failed' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 'sim_t',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: {},
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: [tool] }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].error).toMatch(/Error running tool/i)

    vi.unstubAllGlobals()
  })

  it('handleToolCall sets error when runSimWorkflow HTTP response is not ok', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => {
          if (key === 'sim_api_key_proj') return 'sk-sim-test'
          return null
        },
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'bad input' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tool: any = {
      id: 'w1',
      invocationId: 'inv1',
      name: 'sim_t',
      readableName: 'Tool',
      description: 'd',
      aiGeneratedArgumentValues: {},
    }
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: [tool] }],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].error).toMatch(/Error running tool/i)

    vi.unstubAllGlobals()
  })
})
