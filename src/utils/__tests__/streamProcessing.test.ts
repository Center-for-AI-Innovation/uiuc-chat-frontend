/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

vi.mock('~/app/utils/bedrock', () => ({ runBedrockChat: vi.fn() }))
vi.mock('~/utils/modelProviders/routes/gemini', () => ({
  runGeminiChat: vi.fn(),
}))
vi.mock('~/app/utils/sambanova', () => ({ runSambaNovaChat: vi.fn() }))
vi.mock('~/app/utils/anthropic', () => ({ runAnthropicChat: vi.fn() }))
vi.mock('~/app/utils/ollama', () => ({ runOllamaChat: vi.fn() }))
vi.mock('~/app/utils/vllm', () => ({ runVLLM: vi.fn() }))
vi.mock('~/app/utils/openaiCompatible', () => ({
  runOpenAICompatibleChat: vi.fn(),
}))
vi.mock('~/hooks/__internal__/fetchContextsForChat', () => ({
  fetchContexts: vi.fn(),
  fetchMQRContexts: vi.fn(),
}))
vi.mock('~/pages/api/UIUC-api/fetchImageDescription', () => ({
  fetchImageDescription: vi.fn(),
}))
vi.mock('../citations', () => ({
  replaceCitationLinks: vi.fn(async () => '[CITE]'),
}))
vi.mock('../modelProviders/WebLLM', () => ({ webLLMModels: [] }))
vi.mock('../modelProviders/OpenAIAzureChat', () => ({
  openAIAzureChat: vi.fn(async () => ({ ok: true })),
}))

import { runOpenAICompatibleChat } from '~/app/utils/openaiCompatible'
import { runVLLM } from '~/app/utils/vllm'
import { runOllamaChat } from '~/app/utils/ollama'
import { runAnthropicChat } from '~/app/utils/anthropic'
import { runBedrockChat } from '~/app/utils/bedrock'
import { runGeminiChat } from '~/utils/modelProviders/routes/gemini'
import { runSambaNovaChat } from '~/app/utils/sambanova'
import posthog from 'posthog-js'
import { fetchContexts } from '~/hooks/__internal__/fetchContextsForChat'
import { fetchImageDescription } from '~/pages/api/UIUC-api/fetchImageDescription'
import { replaceCitationLinks } from '../citations'
import { openAIAzureChat } from '../modelProviders/OpenAIAzureChat'
import { NCSAHostedVLMModelID } from '../modelProviders/types/NCSAHostedVLM'
import { OpenAIModelID } from '../modelProviders/types/openai'
import { AnthropicModelID } from '../modelProviders/types/anthropic'
import { BedrockModelID } from '../modelProviders/types/bedrock'
import { GeminiModelID } from '../modelProviders/types/gemini'
import { SambaNovaModelID } from '../modelProviders/types/SambaNova'

import {
  State,
  attachContextsToLastMessage,
  constructSearchQuery,
  getOpenAIKey,
  handleContextSearch,
  handleImageContent,
  handleNonStreamingResponse,
  handleStreamingResponse,
  processChunkWithStateMachine,
  routeModelRequest,
  updateConversationInDatabase,
  validateRequestBody,
} from '../streamProcessing'

describe('processChunkWithStateMachine', () => {
  it('returns empty string for an empty chunk when no buffer is present', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }
    const out = await processChunkWithStateMachine(
      '',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out).toBe('')
  })

  it('replaces <cite>...</cite> blocks using replaceCitationLinks', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }
    const out = await processChunkWithStateMachine(
      'Hello <cite>1</cite>!',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out).toBe('Hello [CITE]!')
    expect(replaceCitationLinks).toHaveBeenCalledWith(
      '<cite>1</cite>',
      lastMessage,
      expect.any(Map),
      'CS101',
    )
  })

  it('buffers partial cite tags across chunks', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }
    const out1 = await processChunkWithStateMachine(
      'Start <cite>2',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out1).toBe('Start ')
    expect(ctx.buffer).toContain('<cite')

    const out2 = await processChunkWithStateMachine(
      '</cite> end',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out2).toBe('[CITE] end')
  })

  it('buffers partial "<cite" prefix when chunk ends mid-token', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out1 = await processChunkWithStateMachine(
      'Hello <ci',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out1).toBe('Hello ')
    expect(ctx.buffer).toBe('<ci')
  })

  it('replaces filename-style citations like "1. [file](url)" via replaceCitationLinks', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      'See 1. [paper.pdf](http://example.com) for more.',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toContain('[CITE]')
    expect(replaceCitationLinks).toHaveBeenCalledWith(
      expect.stringContaining('[paper.pdf]'),
      lastMessage,
      expect.any(Map),
      'CS101',
    )
  })

  it('outputs non-citation "<" characters literally', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      'Hello <div>!',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toBe('Hello <div>!')
  })

  it('buffers trailing digit sequences as PossibleFilename', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      'See 12',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toBe('See ')
    expect(ctx.state).toBe(State.PossibleFilename)
    expect(ctx.buffer).toBe('12')
  })

  it('does not treat digits as citations unless followed by a period', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      'I have 3 cats',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toBe('I have 3 cats')
  })

  it('continues PossibleFilename state across chunks', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out1 = await processChunkWithStateMachine(
      'See 12',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out1).toBe('See ')
    expect(ctx.state).toBe(State.PossibleFilename)
    expect(ctx.buffer).toBe('12')

    const out2 = await processChunkWithStateMachine(
      'x',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out2).toBe('12x')
    expect(ctx.state).toBe(State.Normal)
    expect(ctx.buffer).toBe('')
  })

  it('transitions PossibleFilename to AfterDigitPeriod when a period arrives in the next chunk', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    await processChunkWithStateMachine(
      'See 12',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(ctx.state).toBe(State.PossibleFilename)
    expect(ctx.buffer).toBe('12')

    const out2 = await processChunkWithStateMachine(
      '.',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out2).toBe('')
    expect(ctx.state).toBe(State.AfterDigitPeriod)
    expect(ctx.buffer).toBe('12.')
  })

  it('handles digit-period patterns that are not filename links', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      '1.a',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out).toBe('1.a')
  })

  it('handles digit-period-space patterns that are not filename links', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      '1. a',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out).toBe('1. a')
  })

  it('supports filename links without a space after the period', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      '1.[a](#)',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )
    expect(out).toContain('[CITE]')
  })

  it('switches to InCiteContent when a digit follows a filename link', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      '1. [a](#)2',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toContain('[CITE]')
    expect(ctx.state).toBe(State.InCiteContent)
    expect(ctx.buffer).toBe('2')
  })

  it('buffers citation tags with whitespace in the opening tag', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = {
      id: 'm1',
      role: 'assistant',
      content: '',
      contexts: [{ readable_filename: 'Doc', url: 'https://example.com' }],
    }

    const out = await processChunkWithStateMachine(
      '<cite >1</cite>',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toBe('[CITE]')
  })

  it('buffers partial closing cite tags across chunks', async () => {
    const ctx = { state: State.Normal, buffer: '' }
    const lastMessage: any = { id: 'm1', role: 'assistant', content: '' }

    const out = await processChunkWithStateMachine(
      'Start <cite>1</ci',
      lastMessage,
      ctx,
      new Map(),
      'CS101',
    )

    expect(out).toBe('Start ')
    expect(ctx.state).toBe(State.InCiteContent)
    expect(ctx.buffer).toContain('</ci')
  })
})

describe('validateRequestBody', () => {
  it('throws when required fields are missing', async () => {
    await expect(validateRequestBody({} as any)).rejects.toThrow(/model/i)
  })

  it('throws when model is not supported', async () => {
    await expect(
      validateRequestBody({
        model: 'not-a-model',
        messages: [{ id: 'm1', role: 'user', content: 'hi' }],
        course_name: 'CS101',
        api_key: 'k',
      }),
    ).rejects.toThrow(/invalid model/i)
  })

  it('throws when image content is used with a non-vision model', async () => {
    await expect(
      validateRequestBody({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: [{ type: 'image_url', image_url: { url: 'x' } }],
          } as any,
        ],
        course_name: 'CS101',
        api_key: 'k',
      }),
    ).rejects.toThrow(/does not support vision/i)
  })

  it('throws when messages are missing or invalid', async () => {
    await expect(
      validateRequestBody({
        model: OpenAIModelID.GPT_4o,
        messages: [],
        course_name: 'CS101',
        api_key: 'k',
      } as any),
    ).rejects.toThrow(/invalid or empty messages/i)
  })

  it('throws when temperature is out of range', async () => {
    await expect(
      validateRequestBody({
        model: OpenAIModelID.GPT_4o,
        messages: [{ id: 'm1', role: 'user', content: 'hi' }],
        course_name: 'CS101',
        api_key: 'k',
        temperature: 2,
      } as any),
    ).rejects.toThrow(/invalid temperature/i)
  })

  it('throws when course_name is not a string', async () => {
    await expect(
      validateRequestBody({
        model: OpenAIModelID.GPT_4o,
        messages: [{ id: 'm1', role: 'user', content: 'hi' }],
        course_name: 123,
        api_key: 'k',
      } as any),
    ).rejects.toThrow(/course_name/i)
  })

  it('throws when stream is not a boolean', async () => {
    await expect(
      validateRequestBody({
        model: OpenAIModelID.GPT_4o,
        messages: [{ id: 'm1', role: 'user', content: 'hi' }],
        course_name: 'CS101',
        api_key: 'k',
        stream: 'yes',
      } as any),
    ).rejects.toThrow(/stream/i)
  })
})

describe('constructSearchQuery', () => {
  it('joins user text messages and ignores non-text content entries', () => {
    const q = constructSearchQuery([
      { id: 'a', role: 'assistant', content: 'ignore' } as any,
      { id: 'u1', role: 'user', content: 'hello' } as any,
      {
        id: 'u2',
        role: 'user',
        content: [
          { type: 'text', text: 'from array' },
          { type: 'file', fileName: 'a.pdf' },
        ],
      } as any,
    ])
    expect(q).toBe('hello\nfrom array')
  })

  it('returns empty text for user messages with unsupported content types', () => {
    const q = constructSearchQuery([
      { id: 'u1', role: 'user', content: { foo: 'bar' } } as any,
    ])
    expect(q).toBe('')
  })
})

describe('handleContextSearch / attachContextsToLastMessage', () => {
  it('returns existing contexts without fetching', async () => {
    const message: any = { contexts: [{ id: 1 }] }
    const contexts = await handleContextSearch(
      message,
      'CS101',
      { model: { tokenLimit: 10 } } as any,
      'q',
      [],
    )
    expect(contexts).toEqual([{ id: 1 }])
  })

  it('fetches contexts and attaches to message when missing', async () => {
    ;(fetchContexts as any).mockResolvedValueOnce([{ id: 2 }])
    const message: any = {}
    const selectedConversation: any = { model: { tokenLimit: 123 } }
    const contexts = await handleContextSearch(
      message,
      'CS101',
      selectedConversation,
      'q',
      ['g1'],
    )
    expect(fetchContexts).toHaveBeenCalledWith('CS101', 'q', 123, ['g1'], '')
    expect(contexts).toEqual([{ id: 2 }])
    expect(message.contexts).toEqual([{ id: 2 }])
  })

  it('attachContextsToLastMessage overwrites contexts', () => {
    const msg: any = { contexts: [{ id: 1 }] }
    attachContextsToLastMessage(msg, [{ id: 3 }] as any)
    expect(msg.contexts).toEqual([{ id: 3 }])
  })

  it('attachContextsToLastMessage initializes contexts when missing', () => {
    const msg: any = {}
    attachContextsToLastMessage(msg, [{ id: 1 }] as any)
    expect(msg.contexts).toEqual([{ id: 1 }])
  })

  it('returns [] for gpt4 courseName without fetching contexts', async () => {
    const message: any = {}
    const contexts = await handleContextSearch(
      message,
      'gpt4',
      { model: { tokenLimit: 10 } } as any,
      'q',
      [],
    )
    expect(contexts).toEqual([])
  })
})

describe('handleImageContent', () => {
  it('adds image description text into message content and search query', async () => {
    ;(fetchImageDescription as any).mockResolvedValueOnce('a cat')
    const controller = new AbortController()
    const message: any = {
      content: [{ type: 'image_url', image_url: { url: 'x' } }],
    }

    const result = await handleImageContent(
      message,
      'CS101',
      { id: 'c1', messages: [message] } as any,
      'q',
      {} as any,
      controller,
    )

    expect(result.searchQuery).toContain('Image description: a cat')
    expect(result.imgDesc).toBe('a cat')
    expect(message.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          text: 'Image description: a cat',
        }),
      ]),
    )
  })

  it('updates an existing Image description text entry when present', async () => {
    ;(fetchImageDescription as any).mockResolvedValueOnce('a dog')
    const controller = new AbortController()
    const message: any = {
      content: [
        { type: 'image_url', image_url: { url: 'x' } },
        { type: 'text', text: 'Image description: old' },
      ],
    }

    const result = await handleImageContent(
      message,
      'CS101',
      { id: 'c1', messages: [message] } as any,
      'q',
      {} as any,
      controller,
    )

    expect(result.searchQuery).toContain('Image description: a dog')
    const descTexts = (message.content as any[]).filter(
      (c) =>
        c.type === 'text' && String(c.text).startsWith('Image description:'),
    )
    expect(descTexts).toEqual([
      { type: 'text', text: 'Image description: a dog' },
    ])
  })

  it('aborts controller when fetchImageDescription fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(fetchImageDescription as any).mockRejectedValueOnce(new Error('boom'))
    const controller = new AbortController()
    const message: any = {
      content: [{ type: 'image_url', image_url: { url: 'x' } }],
    }

    const result = await handleImageContent(
      message,
      'CS101',
      { id: 'c1', messages: [message] } as any,
      'q',
      {} as any,
      controller,
    )

    expect(controller.signal.aborted).toBe(true)
    expect(result.imgDesc).toBe('')
    expect(result.searchQuery).toBe('q')
  })
})

describe('getOpenAIKey', () => {
  it('prefers provider apiKey when present', () => {
    const key = getOpenAIKey(
      { OpenAI: { apiKey: 'provider', enabled: true } } as any,
      {} as any,
      'user',
    )
    expect(key).toBe('provider')
  })

  it('falls back to userApiKey when provider apiKey is empty', () => {
    const key = getOpenAIKey(
      { OpenAI: { apiKey: '', enabled: true } } as any,
      {} as any,
      'user',
    )
    expect(key).toBe('user')
  })
})

describe('handleNonStreamingResponse / handleStreamingResponse', () => {
  it('handleNonStreamingResponse writes json response and logs conversation', async () => {
    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { tokenLimit: 10 },
      messages: [
        { id: 'u1', role: 'user', content: 'hi', contexts: [{ id: 1 }] },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    const res: any = {
      statusCode: 0,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: any) {
        this.body = body
        return this
      },
    }

    const apiResponse = new Response(
      JSON.stringify({ choices: [{ message: { content: 'Hello' } }] }),
      { status: 200 },
    )

    await handleNonStreamingResponse(
      apiResponse,
      conversation,
      { headers: {}, socket: {} } as any,
      res,
      'CS101',
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'Hello', contexts: [{ id: 1 }] })
    expect((posthog as any).capture).toHaveBeenCalled()
  })

  it('handleNonStreamingResponse returns 500 when apiResponse body is null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }

    const res: any = {
      statusCode: 0,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: any) {
        this.body = body
        return this
      },
    }

    await handleNonStreamingResponse(
      { body: null } as any,
      conversation,
      { headers: {}, socket: {} } as any,
      res,
      'CS101',
    )
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'API response body is null' })
  })

  it('handleNonStreamingResponse returns 500 when processing response data fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(replaceCitationLinks as any).mockRejectedValueOnce(new Error('boom'))

    const conversation: any = {
      id: 'c1',
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }
    const res: any = {
      statusCode: 0,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(body: any) {
        this.body = body
        return this
      },
    }

    const apiResponse = new Response(
      JSON.stringify({ choices: [{ message: { content: '<cite>1</cite>' } }] }),
      { status: 200 },
    )

    await handleNonStreamingResponse(
      apiResponse,
      conversation,
      { headers: {}, socket: {} } as any,
      res,
      'CS101',
    )
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Failed to process response' })
  })

  it('handleStreamingResponse streams chunks and appends assistant message', async () => {
    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { tokenLimit: 10 },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Hello'))
        controller.enqueue(encoder.encode(' world'))
        controller.close()
      },
    })
    const apiResponse = new Response(body as any, { status: 200 })

    const writes: string[] = []
    const res: any = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: (chunk: string) => writes.push(chunk),
      end: vi.fn(),
      status: vi.fn(() => res),
      json: vi.fn(),
    }
    const req: any = {
      headers: { 'x-forwarded-for': 'ip' },
      socket: { remoteAddress: 'ra' },
    }

    await handleStreamingResponse(apiResponse, conversation, req, res, 'CS101')
    expect(writes.join('')).toBe('Hello world')
    expect(conversation.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'Hello world',
    })
    expect(res.end).toHaveBeenCalled()
  })

  it('handleStreamingResponse returns 500 when apiResponse body is null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { tokenLimit: 10 },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }

    const res: any = {
      status: vi.fn(() => res),
      json: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
    }

    await handleStreamingResponse(
      { body: null } as any,
      conversation,
      { headers: {}, socket: {} } as any,
      res,
      'CS101',
    )
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'API response body is null',
    })
  })

  it('handleStreamingResponse executes the final-buffer flush path when trailing buffer remains', async () => {
    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { tokenLimit: 10 },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 200 }),
    )

    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Hello <ci'))
        controller.close()
      },
    })
    const apiResponse = new Response(body as any, { status: 200 })

    const writes: string[] = []
    const res: any = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: (chunk: string) => writes.push(chunk),
      end: vi.fn(),
      status: vi.fn(() => res),
      json: vi.fn(),
    }
    const req: any = {
      headers: { 'x-forwarded-for': 'ip' },
      socket: { remoteAddress: 'ra' },
    }

    await handleStreamingResponse(apiResponse, conversation, req, res, 'CS101')
    expect(writes.join('')).toBe('Hello ')
    expect(conversation.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'Hello ',
    })
    expect(res.end).toHaveBeenCalled()
  })

  it('handleStreamingResponse returns 500 when the stream reader errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { tokenLimit: 10 },
      messages: [{ id: 'u1', role: 'user', content: 'hi' }],
    }

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('boom'))
      },
    })
    const apiResponse = new Response(body as any, { status: 200 })

    const res: any = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      status: vi.fn(() => res),
      json: vi.fn(),
    }
    const req: any = {
      headers: { 'x-forwarded-for': 'ip' },
      socket: { remoteAddress: 'ra' },
    }

    await handleStreamingResponse(apiResponse, conversation, req, res, 'CS101')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error processing streaming response',
    })
    expect(res.end).toHaveBeenCalled()
  })
})

describe('updateConversationInDatabase', () => {
  it('logs errors from logConversation and still captures posthog event', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    const conversation: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { id: OpenAIModelID.GPT_4o },
      messages: [{ id: 'm1', role: 'assistant', content: 'hi' }],
    }

    await updateConversationInDatabase(conversation, 'CS101', {
      headers: { 'x-forwarded-for': 'ip' },
      socket: { remoteAddress: 'ra' },
    } as any)

    expect((posthog as any).capture).toHaveBeenCalledWith(
      'stream_api_conversation_updated',
      expect.objectContaining({
        conversation_id: 'c1',
        user_id: 'u@example.com',
      }),
    )
  })
})

describe('routeModelRequest', () => {
  function baseConversation(modelId: string) {
    return {
      id: 'c1',
      userEmail: 'u@example.com',
      model: { id: modelId, name: modelId, enabled: true } as any,
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
      prompt: '',
      temperature: 0.5,
      folderId: null,
      name: 'Chat',
    }
  }

  it('throws when conversation model id is missing', async () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    const conv: any = {
      id: 'c1',
      userEmail: 'u@example.com',
      model: {},
      messages: [{ id: 'm1', role: 'user', content: 'hi' }],
    }
    await expect(
      routeModelRequest({
        conversation: conv,
        llmProviders: {},
        stream: false,
      } as any),
    ).rejects.toThrow(/missing "id" property/i)
  })

  it('records anonymous PostHog ids when userEmail is missing', async () => {
    const conv: any = {
      ...baseConversation(OpenAIModelID.GPT_4o),
      userEmail: undefined,
    }
    await routeModelRequest({
      conversation: conv,
      llmProviders: {},
      stream: false,
    } as any)
    expect((posthog as any).capture).toHaveBeenCalledWith(
      'LLM Invoked',
      expect.objectContaining({
        distinct_id: 'anonymous',
        user_id: 'anonymous',
      }),
    )
  })

  it('routes OpenAICompatible models to runOpenAICompatibleChat', async () => {
    const conv = baseConversation(OpenAIModelID.GPT_4o)
    const llmProviders: any = {
      OpenAICompatible: {
        enabled: true,
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'k',
        models: [{ id: OpenAIModelID.GPT_4o, enabled: true }],
      },
    }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: true,
    } as any)
    expect(runOpenAICompatibleChat).toHaveBeenCalled()
  })

  it('routes NCSAHostedVLM model IDs to runVLLM', async () => {
    const conv = baseConversation(NCSAHostedVLMModelID.MOLMO_7B_D_0924)
    const llmProviders: any = { NCSAHostedVLM: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: false,
    } as any)
    expect(runVLLM).toHaveBeenCalled()
  })

  it('routes Ollama model IDs to runOllamaChat', async () => {
    const conv = baseConversation('llama3.2:1b-instruct-fp16')
    const llmProviders: any = { Ollama: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: false,
    } as any)
    expect(runOllamaChat).toHaveBeenCalled()
  })

  it('routes Anthropic model IDs to runAnthropicChat', async () => {
    const conv = baseConversation(AnthropicModelID.Claude_3_7_Sonnet)
    const llmProviders: any = { Anthropic: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: true,
    } as any)
    expect(runAnthropicChat).toHaveBeenCalled()
  })

  it('routes OpenAI/Azure model IDs to openAIAzureChat', async () => {
    const conv = baseConversation(OpenAIModelID.GPT_4o)
    await routeModelRequest({
      conversation: conv,
      llmProviders: {},
      stream: true,
    } as any)
    expect(openAIAzureChat).toHaveBeenCalled()
  })

  it('routes Bedrock model IDs to runBedrockChat', async () => {
    const conv = baseConversation(BedrockModelID.Claude_3_5_Sonnet_Latest)
    const llmProviders: any = { Bedrock: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: false,
    } as any)
    expect(runBedrockChat).toHaveBeenCalled()
  })

  it('routes Gemini model IDs to runGeminiChat', async () => {
    const conv = baseConversation(GeminiModelID.Gemini_2_0_Flash)
    const llmProviders: any = { Gemini: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: false,
    } as any)
    expect(runGeminiChat).toHaveBeenCalled()
  })

  it('routes SambaNova model IDs to runSambaNovaChat', async () => {
    const conv = baseConversation(SambaNovaModelID.Meta_Llama_3_3_70B_Instruct)
    const llmProviders: any = { SambaNova: { enabled: true, models: [] } }

    await routeModelRequest({
      conversation: conv,
      llmProviders,
      stream: true,
    } as any)
    expect(runSambaNovaChat).toHaveBeenCalled()
  })

  it('throws when model is unsupported', async () => {
    const conv = baseConversation('not-a-model')
    await expect(
      routeModelRequest({
        conversation: conv,
        llmProviders: {},
        stream: false,
      } as any),
    ).rejects.toThrow(/not supported/i)
  })
})
