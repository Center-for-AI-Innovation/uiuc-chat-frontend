import { describe, expect, it, vi } from 'vitest'
import type { UIUCTool } from '~/types/chat'

import {
  fetchTools,
  getOpenAIToolFromUIUCTool,
  getUIUCToolFromN8n,
  handleFunctionCall,
  handleToolCall,
  handleToolsServer,
  useFetchAllWorkflows,
} from '../handleFunctionCalling'

describe('handleFunctionCalling utils (browser/jsdom)', () => {
  it('getOpenAIToolFromUIUCTool maps UIUCTool to OpenAICompatibleTool schema', () => {
    const tools: UIUCTool[] = [
      {
        id: '1',
        name: 'my_tool',
        readableName: 'My Tool',
        description: 'desc',
        inputParameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'c' } as any,
            flag: { type: 'Boolean', description: 'f' } as any,
            text: { type: 'string', description: 't' } as any,
          },
          required: ['count'],
        },
      } as any,
    ]

    const out = getOpenAIToolFromUIUCTool(tools)
    expect(out[0]).toMatchObject({
      type: 'function',
      function: {
        name: 'my_tool',
        description: 'desc',
        parameters: expect.objectContaining({
          required: ['count'],
          properties: {
            count: expect.objectContaining({ type: 'number' }),
            flag: expect.objectContaining({ type: 'Boolean' }),
            text: expect.objectContaining({ type: 'string' }),
          },
        }),
      },
    })
  })

  it('getUIUCToolFromN8n extracts active formTrigger workflows', () => {
    const workflows = [
      {
        id: 'w1',
        name: 'My Workflow!',
        active: true,
        updatedAt: 'u',
        createdAt: 'c',
        nodes: [
          {
            type: 'n8n-nodes-base.formTrigger',
            parameters: {
              formDescription: 'd',
              formFields: {
                values: [
                  {
                    fieldLabel: 'First Name',
                    fieldType: 'string',
                    requiredField: true,
                  },
                ],
              },
            },
          },
        ],
      },
      { id: 'w2', name: 'Inactive', active: false, nodes: [] },
    ] as any

    const tools = getUIUCToolFromN8n(workflows)
    expect(tools).toHaveLength(1)
    expect(tools[0]).toMatchObject({
      id: 'w1',
      readableName: 'My Workflow!',
      enabled: true,
      inputParameters: expect.objectContaining({
        required: ['first_name'],
      }),
    })
    expect(tools[0]?.name).toBe('My_Workflow_')
  })

  it('getOpenAIToolFromUIUCTool sets parameters undefined when inputParameters missing', () => {
    const tools: UIUCTool[] = [
      {
        id: '1',
        name: 'no_params',
        readableName: 'No Params',
        description: 'desc',
      } as any,
    ]

    const out = getOpenAIToolFromUIUCTool(tools)
    expect(out[0]?.function.parameters).toBeUndefined()
  })

  it('handleFunctionCall stores model response on last user message when no tool_calls', async () => {
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: 'No tools needed', tool_calls: [] } },
          ],
        }),
        { status: 200 },
      ),
    )

    const tools = await handleFunctionCall(
      message,
      [],
      [],
      '',
      conversation,
      'openai-key',
      'CS101',
    )
    expect(tools).toEqual([])
    expect((conversation.messages[0] as any)._toolRoutingResponse).toBe(
      'No tools needed',
    )
  })

  it('handleFunctionCall heals missing opening brace in tool arguments and returns UIUCTools', async () => {
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call1',
                    function: { name: 'my_tool', arguments: '"x":1}' },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const tools = await handleFunctionCall(
      message,
      availableTools,
      [],
      '',
      conversation,
      'openai-key',
      'CS101',
    )
    expect(tools).toHaveLength(1)
    expect(tools[0]).toMatchObject({
      id: 'w1',
      invocationId: 'call1',
      aiGeneratedArgumentValues: { x: 1 },
    })
  })

  it('handleFunctionCall uses OpenAICompatible and lowercases modelId for OpenRouter', async () => {
    const conversation: any = {
      id: 'c1',
      model: { id: 'MiXeD-Model', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: 'No tools needed', tool_calls: [] } },
          ],
        }),
        { status: 200 },
      ),
    )

    await handleFunctionCall(
      message,
      [],
      [],
      '',
      conversation,
      'ignored-openai-key',
      'CS101',
      undefined,
      {
        OpenAICompatible: {
          enabled: true,
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: 'compat-key',
          models: [{ id: 'mixed-model', enabled: true }],
        },
      } as any,
    )

    const [, options] = fetchSpy.mock.calls[0] as any
    const parsed = JSON.parse(options.body)
    expect(parsed.apiKey).toBe('compat-key')
    expect(parsed.providerBaseUrl).toBe('https://openrouter.ai/api/v1')
    expect(parsed.modelId).toBe('mixed-model')
  })

  it('handleFunctionCall returns [] when tool is not found in availableTools', async () => {
    const availableTools: any[] = []
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call1',
                    function: { name: 'missing_tool', arguments: '{"x":1}' },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const tools = await handleFunctionCall(
      message,
      availableTools,
      [],
      '',
      conversation,
      'openai-key',
      'CS101',
    )
    expect(tools).toEqual([])
  })

  it('handleFunctionCall returns [] when openaiFunctionCall response is not ok', async () => {
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    await expect(
      handleFunctionCall(message, [], [], '', conversation, 'k', 'CS101'),
    ).resolves.toEqual([])
  })

  it('handleFunctionCall uses base_url and omits course_name when not provided', async () => {
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: 'No tools needed', tool_calls: [] } },
          ],
        }),
        { status: 200 },
      ),
    )

    await handleFunctionCall(
      message,
      [],
      [],
      '',
      conversation,
      'openai-key',
      '',
      'http://localhost',
    )

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost/api/chat/openaiFunctionCall',
      expect.anything(),
    )
  })

  it('handleFunctionCall returns [] when tool arguments are invalid JSON', async () => {
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call1',
                    function: { name: 'my_tool', arguments: 'not-json' },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    await expect(
      handleFunctionCall(
        message,
        availableTools,
        [],
        '',
        conversation,
        'k',
        'CS101',
      ),
    ).resolves.toEqual([])
  })

  it('handleFunctionCall returns [] when malformed tool args are unhealable', async () => {
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }

    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call1',
                    function: { name: 'my_tool', arguments: '"x":}' },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    )

    await expect(
      handleFunctionCall(
        message,
        availableTools,
        [],
        '',
        conversation,
        'k',
        'CS101',
      ),
    ).resolves.toEqual([])
  })

  it('handleToolCall runs client-side n8n flow via /api/UIUC-api/runN8nFlow', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify('n8n-key'), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              resultData: {
                lastNodeExecuted: 'final',
                runData: {
                  final: [
                    { data: { main: [[{ json: { response: 'hello' } }]] } },
                  ],
                },
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
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

    await handleToolCall([tool], conversation, 'proj')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/UIUC-api/runN8nFlow',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(conversation.messages[0].tools[0].output).toEqual({ text: 'hello' })
  })

  it('handleToolCall logs when there is no last message', async () => {
    await expect(
      handleToolCall([], { id: 'c1', messages: [] } as any, 'proj'),
    ).resolves.toBeUndefined()
  })

  it('handleToolCall rethrows unexpected errors', async () => {
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
      messages: [{ id: 'm1', role: 'user', content: 'hi', tools: {} }],
    }

    await expect(
      handleToolCall([tool], conversation, 'proj'),
    ).rejects.toBeInstanceOf(TypeError)
  })

  it('handleToolCall sets a timeout error when runN8nFlow fetch aborts', async () => {
    const abortErr = new Error('aborted') as any
    abortErr.name = 'AbortError'

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify('n8n-key'), { status: 200 }),
      )
      .mockRejectedValueOnce(abortErr)

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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].error).toMatch(
      /Request timed out/i,
    )
  })

  it('handleToolCall preserves unexpected fetch errors from runN8nFlow', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify('n8n-key'), { status: 200 }),
      )
      .mockRejectedValueOnce(new Error('boom'))

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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].error).toMatch(/boom/i)
  })

  it('handleToolCall sets an error when runN8nFlow responds non-ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify('n8n-key'), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'bad input' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].error).toMatch(/bad input/i)
  })

  it('fetchTools normalizes invalid limit and returns UIUCTools (client-side)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
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
                  parameters: {
                    formDescription: 'd',
                    formFields: { values: [] },
                  },
                },
              ],
            },
          ],
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tools = await fetchTools('proj', 'k', 0, 'false', false)
    expect(tools).toHaveLength(1)
    expect(tools[0]?.id).toBe('w1')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('pagination=false'),
    )
  })

  it('useFetchAllWorkflows throws when neither course_name nor api_key provided', () => {
    expect(() => useFetchAllWorkflows()).toThrow(
      /one of course_name OR api_key/i,
    )
  })

  it('handleToolsServer runs function selection then tool execution', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy
      // openaiFunctionCall
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      id: 'call1',
                      function: { name: 'my_tool', arguments: '{"x":1}' },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      // getN8nKeyFromProject
      .mockResolvedValueOnce(
        new Response(JSON.stringify('n8n-key'), { status: 200 }),
      )
      // runN8nFlow
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              resultData: {
                lastNodeExecuted: 'final',
                runData: {
                  final: [
                    { data: { main: [[{ json: { response: 'hello' } }]] } },
                  ],
                },
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )

    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const message: any = { id: 'u1', role: 'user', content: 'hi' }
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]

    const updated = await handleToolsServer(
      message,
      availableTools,
      [],
      '',
      conversation,
      'openai-key',
      'proj',
    )

    expect(updated.messages[0].tools[0].output).toEqual({ text: 'hello' })
  })

  it('handleToolsServer returns selectedConversation when tool execution throws', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: 'call1',
                    function: { name: 'my_tool', arguments: '{"x":1}' },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    vi.spyOn(console, 'error').mockImplementation(() => {})

    const message: any = { id: 'u1', role: 'user', content: 'hi' }
    Object.defineProperty(message, 'tools', {
      configurable: true,
      get() {
        return (this as any).__tools
      },
      set() {
        ;(this as any).__tools = {}
      },
    })

    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [message],
    }
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]

    const updated = await handleToolsServer(
      message,
      availableTools,
      [],
      '',
      conversation,
      'openai-key',
      'proj',
    )

    expect(updated).toBe(conversation)
    expect(updated.messages).toHaveLength(1)
  })
})
