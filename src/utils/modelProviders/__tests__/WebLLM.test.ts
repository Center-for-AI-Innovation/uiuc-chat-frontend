/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

function makeEngine(overrides: Partial<any> = {}) {
  return {
    setAppConfig: vi.fn(),
    setInitProgressCallback: vi.fn(),
    reload: vi.fn(async () => undefined),
    unload: vi.fn(async () => undefined),
    resetChat: vi.fn(async () => undefined),
    interruptGenerate: vi.fn(),
    getMessage: vi.fn(async () => 'final'),
    chat: {
      completions: {
        create: vi.fn(async () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              choices: [{ delta: { content: 'A' }, finish_reason: null }],
            }
            yield {
              choices: [{ delta: { content: 'B' }, finish_reason: null }],
              usage: {
                prompt_tokens: 1,
                completion_tokens: 2,
                extra: {
                  prefill_tokens_per_s: 1.23,
                  decode_tokens_per_s: 4.56,
                },
              },
            }
          },
        })),
      },
    },
    ...overrides,
  }
}

describe('WebLLM', () => {
  it('marks downloadSize as unknown when vram_required_MB is missing', async () => {
    vi.resetModules()
    vi.doMock('../ConfigWebLLM', () => ({
      prebuiltAppConfig: {
        model_list: [
          {
            model_id: 'm1',
            overrides: { context_window_size: 123 },
            default: true,
            temperature: 0.2,
          },
        ],
      },
    }))

    const { webLLMModels } = await import('../WebLLM')
    expect(webLLMModels[0]?.downloadSize).toBe('unknown')

    vi.doUnmock('../ConfigWebLLM')
    vi.resetModules()
  })

  it('getWebLLMModels populates defaults when models are missing/disabled and filters unknown models', async () => {
    const { getWebLLMModels, webLLMModels } = await import('../WebLLM')

    const filled = await getWebLLMModels({ enabled: false } as any)
    expect(filled.provider).toBe('WebLLM')
    expect(Array.isArray(filled.models)).toBe(true)

    const filtered = await getWebLLMModels({
      enabled: true,
      models: [
        { id: webLLMModels[0]!.id, enabled: true },
        { id: 'not-in-master', enabled: true },
      ],
    } as any)
    expect(filtered.models?.some((m: any) => m.id === 'not-in-master')).toBe(
      false,
    )
  })

  it('asyncInitChat reports progress and unloads on reload errors', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine({
      setInitProgressCallback: vi.fn((cb: any) => cb({ text: 'loading' })),
      reload: vi.fn(async () => {
        throw new Error('fail')
      }),
    })
    const chat = new ChatUI(engine as any)

    const updates: Array<{ kind: string; text: string; append: boolean }> = []
    await chat.asyncInitChat((kind, text, append) =>
      updates.push({ kind, text, append }),
    )

    expect(updates.some((u) => u.kind === 'init' && u.text === 'loading')).toBe(
      true,
    )
    expect(updates.some((u) => u.kind === 'error')).toBe(true)
    expect(engine.unload).toHaveBeenCalled()
  })

  it('onGenerate ignores new requests while a request is in progress', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const chat = new ChatUI(makeEngine() as any)
    ;(chat as any).requestInProgress = true
    await expect(
      chat.onGenerate('hi', vi.fn(), vi.fn()),
    ).resolves.toBeUndefined()
  })

  it('onReset interrupts generation when request is in progress', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine()
    const chat = new ChatUI(engine as any)
    ;(chat as any).requestInProgress = true

    await chat.onReset(vi.fn())
    expect(engine.interruptGenerate).toHaveBeenCalled()
    expect(engine.resetChat).toHaveBeenCalled()
  })

  it('loadModel toggles isModelLoading and handles reload failures', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine()
    const chat = new ChatUI(engine as any)

    await chat.loadModel({ model: { name: 'm1' } })
    expect(chat.isModelLoading()).toBe(false)

    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    ;(engine.reload as any).mockRejectedValueOnce(new Error('boom'))
    await chat.loadModel({ model: { name: 'm2' } })
    errSpy.mockRestore()
  })

  it('runChatCompletion builds messages and warns when engineered message is missing', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine({
      chat: { completions: { create: vi.fn(async () => ({ ok: true })) } },
    })
    const chat = new ChatUI(engine as any)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          messages: [
            { role: 'user', content: 'hi' },
            { role: 'assistant', content: [{ type: 'text', text: 'a' }] },
            { role: 'user', content: 'final', latestSystemMessage: 'SYS' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const errSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await chat.runChatCompletion(
      { conversation: { messages: [] } as any } as any,
      'CS101',
      { is_private: false } as any,
    )

    errSpy.mockRestore()
    fetchSpy.mockRestore()
    expect(
      (engine.chat.completions.create as any).mock.calls[0]?.[0]?.stream,
    ).toBe(true)
  })

  it('runChatCompletion uses finalPromptEngineeredMessage for the last user message when present', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine({
      chat: { completions: { create: vi.fn(async () => ({ ok: true })) } },
    })
    const chat = new ChatUI(engine as any)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          messages: [
            { role: 'user', content: 'hi' },
            {
              role: 'user',
              content: 'final',
              latestSystemMessage: 'SYS',
              finalPromtEngineeredMessage: 'ENGINEERED',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    await chat.runChatCompletion(
      { conversation: { messages: [] } as any } as any,
      'CS101',
      { is_private: false } as any,
    )

    const call = (engine.chat.completions.create as any).mock.calls[0]?.[0]
    expect(call.messages.at(-1).content).toBe('ENGINEERED')
  })

  it('onGenerate streams tokens and updates runtime stats', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const chat = new ChatUI(makeEngine() as any)

    const updates: Array<{ kind: string; text: string; append: boolean }> = []
    const stats = vi.fn()
    await chat.onGenerate(
      'hello',
      (k, t, a) => updates.push({ kind: k, text: t, append: a }),
      stats,
    )

    expect(
      updates.some((u) => u.kind === 'left' && u.text.includes('AB')),
    ).toBe(true)
    expect(stats).toHaveBeenCalled()
  })

  it('onGenerate returns early when prompt is empty', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const chat = new ChatUI(makeEngine() as any)
    ;(chat as any).chatLoaded = true

    const updates = vi.fn()
    await chat.onGenerate('', updates, vi.fn())
    expect(updates).not.toHaveBeenCalledWith(
      'right',
      expect.anything(),
      expect.anything(),
    )
  })

  it('onGenerate unloads on generation errors', async () => {
    const { default: ChatUI } = await import('../WebLLM')
    const engine = makeEngine({
      chat: {
        completions: {
          create: vi.fn(async () => {
            throw new Error('boom')
          }),
        },
      },
    })
    const chat = new ChatUI(engine as any)

    const updates: Array<{ kind: string; text: string; append: boolean }> = []
    await chat.onGenerate(
      'hi',
      (k, t, a) => updates.push({ kind: k, text: t, append: a }),
      vi.fn(),
    )

    expect(updates.some((u) => u.kind === 'error')).toBe(true)
    expect(engine.unload).toHaveBeenCalled()
  })
})
