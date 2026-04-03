import { describe, expect, it, vi } from 'vitest'
import type { Conversation, Message, UIUCTool } from '~/types/chat'
import type { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

import {
  fetchSimTools,
  getOpenAIToolFromUIUCTool,
  getUIUCToolFromSim,
  handleFunctionCall,
  handleToolCall,
  handleToolsServer,
  useFetchAllWorkflows,
} from '../handleFunctionCalling'

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}))

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

  it('getUIUCToolFromSim converts SimWorkflow[] to UIUCTool[]', () => {
    const workflows = [
      {
        id: 'w1',
        name: 'My Workflow!',
        description: 'does stuff',
        inputFields: [
          { name: 'first_name', type: 'string', description: 'First name' },
          { name: 'count', type: 'number', description: 'Count' },
        ],
      },
      {
        id: 'w2',
        name: 'No Inputs',
        description: '',
        inputFields: [],
      },
    ] as any

    const tools = getUIUCToolFromSim(workflows)
    expect(tools).toHaveLength(2)
    expect(tools[0]).toMatchObject({
      id: 'w1',
      name: 'sim_my_workflow',
      readableName: 'My Workflow!',
      enabled: true,
      inputParameters: expect.objectContaining({
        required: ['first_name', 'count'],
      }),
    })
    // No inputs → default 'input' field
    expect(tools[1]).toMatchObject({
      id: 'w2',
      name: 'sim_no_inputs',
      inputParameters: expect.objectContaining({ required: ['input'] }),
    })
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

  it('fetchSimTools returns [] when no localStorage credentials', async () => {
    // jsdom localStorage is empty by default
    localStorage.clear()
    const tools = await fetchSimTools('proj')
    expect(tools).toEqual([])
  })

  it('fetchSimTools returns UIUCTools when API responds ok', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')
    localStorage.setItem('sim_workspace_id_proj', 'ws-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          workflows: [
            {
              id: 'w1',
              name: 'My Flow',
              description: 'desc',
              inputFields: [{ name: 'q', type: 'string', description: 'Query' }],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const tools = await fetchSimTools('proj')
    expect(tools).toHaveLength(1)
    expect(tools[0]?.name).toBe('sim_my_flow')

    localStorage.clear()
  })

  it('fetchSimTools returns [] on non-ok response', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')
    localStorage.setItem('sim_workspace_id_proj', 'ws-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500 }),
    )

    const tools = await fetchSimTools('proj')
    expect(tools).toEqual([])

    localStorage.clear()
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

  it('handleFunctionCall appends tool invocations when message.tools already exists', async () => {
    const availableTools: any[] = [
      { id: 'w1', name: 'my_tool', readableName: 'My Tool', description: 'd' },
    ]
    const existingTool: any = {
      id: 'prev',
      name: 'prev_tool',
      readableName: 'Prev Tool',
      invocationId: 'prev1',
    }
    const message: any = {
      id: 'u1',
      role: 'user',
      content: 'hi',
      tools: [existingTool],
    }
    const conversation: any = {
      id: 'c1',
      model: { id: 'gpt-4o', name: 'm', tokenLimit: 10, enabled: true },
      messages: [message],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
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
    expect(conversation.messages[0].tools).toHaveLength(2)
    expect(conversation.messages[0].tools[0]).toMatchObject({
      id: 'prev',
      invocationId: 'prev1',
    })
    expect(conversation.messages[0].tools[1]).toMatchObject({
      id: 'w1',
      invocationId: 'call1',
    })
  })

  it('handleFunctionCall uses OpenAICompatible and lowercases modelId for OpenRouter', async () => {
    const conversation = {
      id: 'c1',
      model: { id: 'MiXeD-Model', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    } as unknown as Conversation
    const message = {
      id: 'u1',
      role: 'user',
      content: 'hi',
    } as unknown as Message

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
      } as unknown as AllLLMProviders,
    )

    const [, options] = fetchSpy.mock.calls[0] as unknown as [
      unknown,
      RequestInit,
    ]
    const parsed = JSON.parse(String(options.body))
    expect(parsed.apiKey).toBe('compat-key')
    expect(parsed.providerBaseUrl).toBe('https://openrouter.ai/api/v1')
    expect(parsed.modelId).toBe('mixed-model')
  })

  it('handleFunctionCall keeps modelId when OpenAICompatible baseUrl is invalid', async () => {
    const conversation = {
      id: 'c1',
      model: { id: 'MiXeD-Model', name: 'm', tokenLimit: 10, enabled: true },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    } as unknown as Conversation
    const message = {
      id: 'u1',
      role: 'user',
      content: 'hi',
    } as unknown as Message

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
          baseUrl: 'not-a-url',
          apiKey: 'compat-key',
          models: [{ id: 'MiXeD-Model', enabled: true }],
        },
      } as unknown as AllLLMProviders,
    )

    const [, options] = fetchSpy.mock.calls[0] as unknown as [
      unknown,
      RequestInit,
    ]
    const parsed = JSON.parse(String(options.body))
    expect(parsed.modelId).toBe('MiXeD-Model')
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

  it('handleToolCall runs Sim workflow via /api/UIUC-api/runSimWorkflow', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
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

    await handleToolCall([tool], conversation, 'proj')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/UIUC-api/runSimWorkflow',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(conversation.messages[0].tools[0].output).toEqual({ text: 'hello' })

    localStorage.clear()
  })

  it('handleToolCall sets error when Sim API key is missing', async () => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})

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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].error).toMatch(/Error running tool/i)
  })

  it('handleToolCall sets error when runSimWorkflow responds non-ok', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')
    vi.spyOn(console, 'error').mockImplementation(() => {})

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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].error).toMatch(/Error running tool/i)

    localStorage.clear()
  })

  it('handleToolCall sets data output when Sim returns object output', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, output: { result: 42 } }),
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

    await handleToolCall([tool], conversation, 'proj')
    expect(conversation.messages[0].tools[0].output).toEqual({
      data: { result: 42 },
    })

    localStorage.clear()
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

  it('handleToolsServer runs function selection then Sim tool execution', async () => {
    localStorage.setItem('sim_api_key_proj', 'sk-sim-test')

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
      // runSimWorkflow
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, output: 'hello' }),
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

    expect(updated.messages[0].tools?.[0]?.output).toEqual({ text: 'hello' })

    localStorage.clear()
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
