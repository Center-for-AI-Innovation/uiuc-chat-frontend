/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  class OpenAIError extends Error {
    constructor(
      message: string,
      public type?: string,
      public param?: string,
      public code?: string,
    ) {
      super(message)
      this.name = 'OpenAIError'
    }
  }
  const OpenAIStream = vi.fn()
  return { OpenAIError, OpenAIStream }
})

vi.mock('@/utils/server', () => ({
  OpenAIError: hoisted.OpenAIError,
  OpenAIStream: hoisted.OpenAIStream,
}))

import { openAIAzureChat } from '../OpenAIAzureChat'

describe('openAIAzureChat', () => {
  it('wraps unexpected errors as OpenAIError', async () => {
    await expect(openAIAzureChat({ conversation: undefined } as any, true)).rejects.toBeInstanceOf(
      hoisted.OpenAIError,
    )
  })

  it('throws when latestSystemMessage is missing', async () => {
    const chatBody: any = {
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [{ id: 'u1', role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      },
      llmProviders: {},
    }

    await expect(openAIAzureChat(chatBody, true)).rejects.toBeInstanceOf(hoisted.OpenAIError)
  })

  it('converts messages and returns an event-stream Response when stream=true', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hi'))
        controller.close()
      },
    })
    hoisted.OpenAIStream.mockResolvedValueOnce(stream)

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          { id: 's1', role: 'system', content: [{ type: 'text', text: 'sys' }] },
          {
            id: 'u1',
            role: 'user',
            content: [
              { type: 'text', text: 'before' },
              { type: 'file', fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 1024 },
            ],
          },
          {
            id: 'a1',
            role: 'assistant',
            content: [{ type: 'tool_image_url', image_url: { url: 'x' } }],
          },
          {
            id: 'u2',
            role: 'user',
            content: [{ type: 'text', text: 'original' }],
            finalPromtEngineeredMessage: 'ENGINEERED',
            latestSystemMessage: 'SYS',
            contexts: [{ id: 1 }],
            tools: [],
          },
        ],
      },
    }

    const res = await openAIAzureChat(chatBody, true)
    expect(res).toBeInstanceOf(Response)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    expect(hoisted.OpenAIStream).toHaveBeenCalled()
    const call = hoisted.OpenAIStream.mock.calls[0]!
    expect(call[1]).toBe('SYS') // systemPrompt
    const messagesToSend = call[4] as any[]
    const last = messagesToSend.at(-1)
    expect(last.content[0].text).toBe('ENGINEERED')
    // file converted to text
    const fileConverted = messagesToSend[1].content.find((c: any) => c.type === 'text' && String(c.text).includes('[File:'))
    expect(fileConverted).toBeTruthy()
    // tool_image_url converted to image_url
    expect(messagesToSend[2].content[0].type).toBe('image_url')
    // stripped fields
    expect(last.finalPromtEngineeredMessage).toBeUndefined()
    expect(last.latestSystemMessage).toBeUndefined()
    expect(last.contexts).toBeUndefined()
  })

  it('returns the raw apiStream when stream=true but apiStream is not a ReadableStream', async () => {
    hoisted.OpenAIStream.mockResolvedValueOnce({ ok: true })

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: [{ type: 'text', text: 'hi' }],
            finalPromtEngineeredMessage: 'hi',
            latestSystemMessage: 'SYS',
          },
        ],
      },
    }

    await expect(openAIAzureChat(chatBody, true)).resolves.toEqual({ ok: true })
  })

  it('returns JSON Response when stream=false', async () => {
    hoisted.OpenAIStream.mockResolvedValueOnce({ ok: true })

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: [{ type: 'text', text: 'hi' }],
            finalPromtEngineeredMessage: 'hi',
            latestSystemMessage: 'SYS',
          },
        ],
      },
    }

    const res = await openAIAzureChat(chatBody, false)
    expect(res.headers.get('Content-Type')).toBe('application/json')
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it('rethrows OpenAIError instances', async () => {
    hoisted.OpenAIStream.mockRejectedValueOnce(new hoisted.OpenAIError('bad'))

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: [{ type: 'text', text: 'hi' }],
            finalPromtEngineeredMessage: 'hi',
            latestSystemMessage: 'SYS',
          },
        ],
      },
    }

    await expect(openAIAzureChat(chatBody, true)).rejects.toBeInstanceOf(hoisted.OpenAIError)
  })

  it('wraps non-Error throws using a generic OpenAIError message', async () => {
    hoisted.OpenAIStream.mockRejectedValueOnce('boom')

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: [{ type: 'text', text: 'hi' }],
            finalPromtEngineeredMessage: 'hi',
            latestSystemMessage: 'SYS',
          },
        ],
      },
    }

    await expect(openAIAzureChat(chatBody, true)).rejects.toMatchObject({
      name: 'OpenAIError',
      type: 'unexpected_error',
    })
  })

  it('converts string content for the last user/system message', async () => {
    hoisted.OpenAIStream.mockResolvedValueOnce({ ok: true })

    const chatBody: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 'u1',
            role: 'user',
            content: 'hi',
            finalPromtEngineeredMessage: 'ENGINEERED',
            latestSystemMessage: 'SYS',
          },
        ],
      },
    }

    await openAIAzureChat(chatBody, true)
    const messagesToSend = hoisted.OpenAIStream.mock.calls.at(-1)?.[4] as any[]
    expect(messagesToSend[0].content[0].text).toBe('ENGINEERED')

    hoisted.OpenAIStream.mockResolvedValueOnce({ ok: true })
    const chatBody2: any = {
      llmProviders: { OpenAI: { enabled: true } },
      conversation: {
        model: { id: 'gpt-4o' },
        temperature: 0.1,
        messages: [
          {
            id: 's1',
            role: 'system',
            content: 'sys',
            latestSystemMessage: 'SYS2',
          },
        ],
      },
    }
    await openAIAzureChat(chatBody2, true)
    const messagesToSend2 = hoisted.OpenAIStream.mock.calls.at(-1)?.[4] as any[]
    expect(messagesToSend2[0].content[0].text).toBe('SYS2')
  })
})
