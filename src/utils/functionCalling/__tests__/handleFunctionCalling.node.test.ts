/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

vi.mock('~/pages/api/UIUC-api/runN8nFlow', () => ({
  runN8nFlowBackend: vi.fn(),
}))

vi.mock('~/utils/apiUtils', () => ({
  getBackendUrl: vi.fn(() => undefined),
}))

describe('handleFunctionCalling (node)', () => {
  it('fetchTools returns [] when no api_key exists for project (404)', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 404 }),
    )

    await expect(
      fetchTools('proj', 'undefined', 10, 'true', false, 'http://localhost'),
    ).resolves.toEqual([])
  })

  it('fetchTools returns [] when fetching the project api_key fails', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(
      fetchTools('proj', 'undefined', 10, 'true', false, 'http://localhost'),
    ).resolves.toEqual([])
  })

  it('fetchTools returns [] when the fetched api_key is still undefined', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('undefined'), { status: 200 }),
    )

    await expect(
      fetchTools('proj', 'undefined', 10, 'true', false, 'http://localhost'),
    ).resolves.toEqual([])
  })

  it('fetchTools throws when backendUrl is missing on the server', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')
    await expect(fetchTools('proj', 'k', 10, 'true', false)).rejects.toThrow(
      /No backend URL configured/i,
    )
  })

  it('fetchTools calls the backend /getworkflows endpoint on the server', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')
    const { getBackendUrl } = await import('~/utils/apiUtils')

    ;(getBackendUrl as any).mockReturnValueOnce('http://backend')

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          [
            {
              id: 'w1',
              name: 'My Workflow',
              active: true,
              updatedAt: 'u',
              createdAt: 'c',
              nodes: [
                {
                  type: 'n8n-nodes-base.formTrigger',
                  parameters: { formDescription: 'd', formFields: { values: [] } },
                },
              ],
            },
          ],
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tools = await fetchTools('proj', 'k', 10, 'true', false)
    expect(tools).toHaveLength(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('http://backend/getworkflows?api_key=k&limit=10&pagination=true'),
    )
  })

  it('fetchTools throws when the backend responds non-ok', async () => {
    const { fetchTools } = await import('../handleFunctionCalling')
    const { getBackendUrl } = await import('~/utils/apiUtils')

    ;(getBackendUrl as any).mockReturnValueOnce('http://backend')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'Server Error' }),
    )

    await expect(fetchTools('proj', 'k', 10, 'true', false)).rejects.toThrow(
      /Unable to fetch n8n tools/i,
    )
  })

  it('handleToolCall populates tool output via runN8nFlowBackend on the server', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')

    ;(runN8nFlowBackend as any).mockResolvedValueOnce({
      data: {
        resultData: {
          lastNodeExecuted: 'final',
          runData: {
            final: [
              {
                data: {
                  main: [[{ json: { response: 'hello' } }]],
                },
              },
            ],
          },
        },
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )

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
    expect(conversation.messages[0].tools[0].output).toEqual({ text: 'hello' })
  })

  it('handleToolCall sets error when server-side n8n api_key resolves to empty string', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(''), { status: 200 }),
    )

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
    expect(conversation.messages[0].tools[0].error).toMatch(/N8N API key is required/i)
  })

  it('handleToolCall sets timeout error when runN8nFlowBackend throws timed out', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockRejectedValueOnce(new Error('timed out'))

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
    expect(conversation.messages[0].tools[0].error).toMatch(/Request timed out/i)
  })

  it('handleToolCall preserves non-timeout errors from runN8nFlowBackend', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockRejectedValueOnce(new Error('boom'))

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
    expect(conversation.messages[0].tools[0].error).toMatch(/boom/i)
  })

  it('handleToolCall sets empty response error when workflow response is missing json', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockResolvedValueOnce({
      data: {
        resultData: {
          lastNodeExecuted: 'final',
          runData: {
            final: [
              {
                data: {
                  main: [[{}]],
                },
              },
            ],
          },
        },
      },
    })

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
    expect(conversation.messages[0].tools[0].error).toMatch(/empty response/i)
  })

  it('handleToolCall skips tools missing invocationId', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const tool: any = {
      id: 'w1',
      // invocationId intentionally missing
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

  it('handleToolCall sets error when fetching n8n key fails', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

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

  it('handleToolCall sets error when n8n workflow returns an error object', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockResolvedValueOnce({
      data: {
        resultData: {
          lastNodeExecuted: 'final',
          runData: {
            final: [
              {
                error: { message: 'Boom', description: 'Bad input' },
              },
            ],
          },
        },
      },
    })

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
    expect(conversation.messages[0].tools[0].error).toMatch(/Boom/i)
  })

  it('handleToolCall returns imageUrls output when workflow responds with image_urls only', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockResolvedValueOnce({
      data: {
        resultData: {
          lastNodeExecuted: 'final',
          runData: {
            final: [
              {
                data: {
                  main: [[{ json: { image_urls: ['a.png'] } }]],
                },
              },
            ],
          },
        },
      },
    })

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
    expect(conversation.messages[0].tools[0].output).toEqual({
      imageUrls: ['a.png'],
    })
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

  it('handleToolCall skips when invocationId is not found on the last message tools list', async () => {
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
        { id: 'm1', role: 'user', content: 'hi', tools: [{ ...tool, invocationId: 'other' }] },
      ],
    }

    await handleToolCall([tool], conversation, 'proj', 'http://localhost')
    expect(conversation.messages[0].tools[0].output).toBeUndefined()
  })

  it('handleToolCall parses JSON "data" output and merges image_urls when present', async () => {
    const { handleToolCall } = await import('../handleFunctionCalling')
    const { runN8nFlowBackend } = await import('~/pages/api/UIUC-api/runN8nFlow')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify('n8n-key'), { status: 200 }),
    )
    ;(runN8nFlowBackend as any).mockResolvedValueOnce({
      data: {
        resultData: {
          lastNodeExecuted: 'final',
          runData: {
            final: [
              {
                data: {
                  main: [[{ json: { data: { a: 1 }, image_urls: ['x.png'] } }]],
                },
              },
            ],
          },
        },
      },
    })

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
    expect(conversation.messages[0].tools[0].output).toEqual({
      data: { a: 1 },
      imageUrls: ['x.png'],
    })
  })
})
