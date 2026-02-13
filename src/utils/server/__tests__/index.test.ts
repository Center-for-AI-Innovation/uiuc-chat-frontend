/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { ProviderNames } from '~/utils/modelProviders/LLMProvider'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'

import { OpenAIError, OpenAIStream } from '../index'

function makeProviders(modelId: string) {
  return {
    [ProviderNames.OpenAI]: {
      enabled: true,
      apiKey: 'sk-test',
      models: [{ id: modelId, enabled: true }],
    },
    [ProviderNames.Azure]: { enabled: false, models: [] },
    [ProviderNames.NCSAHostedVLM]: { enabled: false, models: [] },
  } as any
}

describe('OpenAIStream', () => {
  it('throws OpenAIError when API returns { error: ... }', async () => {
    const providers = makeProviders('gpt-4o')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { message: 'bad', type: 'api_error', param: 'x', code: 'y' },
        }),
        { status: 400 },
      ),
    )

    await expect(
      OpenAIStream(
        { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        providers,
        [],
        false,
      ),
    ).rejects.toBeInstanceOf(OpenAIError)
  })

  it('returns JSON when stream=false and response is ok', async () => {
    const providers = makeProviders('gpt-4o')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    await expect(
      OpenAIStream(
        { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        providers,
        [],
        false,
      ),
    ).resolves.toEqual({ ok: true })
  })

  it('builds an Azure deployment URL and sends api-key header when model belongs to Azure provider', async () => {
    const providers = {
      [ProviderNames.OpenAI]: { enabled: false, models: [] },
      [ProviderNames.Azure]: {
        enabled: true,
        apiKey: 'azure-key',
        AzureEndpoint: 'https://azure.example.com',
        models: [{ id: 'gpt-4o', enabled: true, azureDeploymentID: 'dep-123' }],
      },
      [ProviderNames.NCSAHostedVLM]: { enabled: false, models: [] },
    } as any

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    await OpenAIStream(
      { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      false,
    )

    const [url, init] = fetchSpy.mock.calls[0] as any
    expect(String(url)).toContain(
      'https://azure.example.com/openai/deployments/dep-123/chat/completions',
    )
    expect(init.headers).toMatchObject({ 'api-key': 'azure-key' })
  })

  it('builds an NCSA hosted URL when model belongs to NCSAHostedVLM provider', async () => {
    process.env.NCSA_HOSTED_VLM_BASE_URL = 'https://vlm.example.com'
    process.env.NCSA_HOSTED_API_KEY = 'ignored-in-request'

    const providers = {
      [ProviderNames.OpenAI]: { enabled: false, models: [] },
      [ProviderNames.Azure]: { enabled: false, models: [] },
      [ProviderNames.NCSAHostedVLM]: {
        enabled: true,
        apiKey: '',
        models: [{ id: 'vlm-1', enabled: true }],
      },
    } as any

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    await OpenAIStream(
      { id: 'vlm-1', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      false,
    )

    const [url, init] = fetchSpy.mock.calls[0] as any
    expect(url).toBe('https://vlm.example.com/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer ignored-in-request')
    expect(init.headers['api-key']).toBeUndefined()
  })

  it('uses developer role and omits temperature for o-series models', async () => {
    const providers = makeProviders(OpenAIModelID.o3)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    await OpenAIStream(
      { id: OpenAIModelID.o3, name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.42,
      providers,
      [],
      false,
    )

    const init = fetchSpy.mock.calls[0]?.[1] as any
    const body = JSON.parse(init.body)
    expect(body.messages[0].role).toBe('developer')
    expect(body.temperature).toBeUndefined()
  })

  it('strips -thinking and sets reasoning_effort for reasoning-capable models', async () => {
    const providers = makeProviders(OpenAIModelID.GPT_5_thinking)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    await OpenAIStream(
      {
        id: OpenAIModelID.GPT_5_thinking,
        name: 'm',
        tokenLimit: 1,
        enabled: true,
      } as any,
      'sys',
      0.99,
      providers,
      [],
      false,
    )

    const body = JSON.parse((fetchSpy.mock.calls[0]?.[1] as any).body)
    expect(body.model).toBe('gpt-5')
    expect(body.reasoning_effort).toBe('medium')
    expect(body.temperature).toBeUndefined()
  })

  it('throws a generic error when API returns non-JSON error body', async () => {
    const providers = makeProviders('gpt-4o')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('plain error', { status: 500, statusText: 'Server Error' }),
    )

    await expect(
      OpenAIStream(
        { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        providers,
        [],
        false,
      ),
    ).rejects.toThrow(/OpenAI API returned an error/)
  })

  it('throws when no provider supports the requested model', async () => {
    const providers = {
      [ProviderNames.OpenAI]: { enabled: true, apiKey: 'sk', models: [] },
      [ProviderNames.Azure]: { enabled: false, models: [] },
      [ProviderNames.NCSAHostedVLM]: { enabled: false, models: [] },
    } as any

    await expect(
      OpenAIStream(
        { id: 'unknown-model', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        providers,
        [],
        false,
      ),
    ).rejects.toThrow(/Unsupported OpenAI or Azure configuration/)
  })

  it('throws when url is undefined (no providers provided)', async () => {
    await expect(
      OpenAIStream(
        { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        undefined as any,
        [],
        false,
      ),
    ).rejects.toThrow('URL is undefined')
  })

  it('includes OpenAI-Organization header when configured', async () => {
    const prevOrg = process.env.OPENAI_ORGANIZATION
    process.env.OPENAI_ORGANIZATION = 'org-123'

    try {
      vi.resetModules()
      const mod = await import('../index')
      const providers = makeProviders('gpt-4o')

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        )

      await mod.OpenAIStream(
        { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
        'sys',
        0.1,
        providers,
        [],
        false,
      )

      const init = fetchSpy.mock.calls[0]?.[1] as any
      expect(init.headers).toMatchObject({ 'OpenAI-Organization': 'org-123' })
    } finally {
      process.env.OPENAI_ORGANIZATION = prevOrg
    }
  })

  it('returns a ReadableStream when stream=true and yields parsed content', async () => {
    const providers = makeProviders('gpt-4o')

    const encoder = new TextEncoder()
    const sse = [
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ].join('')

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sse))
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body as any, { status: 200 }),
    )

    const stream = (await OpenAIStream(
      { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      true,
    )) as ReadableStream

    const reader = stream.getReader()
    let out = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      out += new TextDecoder().decode(value)
    }
    expect(out).toBe('Hello world')
  })

  it('closes the stream on [DONE] when no finish_reason is provided', async () => {
    const providers = makeProviders('gpt-4o')

    const encoder = new TextEncoder()
    const sse = [
      'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
    ].join('')

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sse))
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body as any, { status: 200 }),
    )

    const stream = (await OpenAIStream(
      { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      true,
    )) as ReadableStream

    const reader = stream.getReader()
    let out = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      out += new TextDecoder().decode(value)
    }
    expect(out).toBe('Hello world')
  })

  it('surfaces JSON parse errors from SSE events', async () => {
    const providers = makeProviders('gpt-4o')
    const encoder = new TextEncoder()

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {not json}\n\n'))
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body as any, { status: 200 }),
    )

    const stream = (await OpenAIStream(
      { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      true,
    )) as ReadableStream

    const reader = stream.getReader()
    await expect(reader.read()).rejects.toBeInstanceOf(SyntaxError)
  })

  it('surfaces body iteration errors while streaming', async () => {
    const providers = makeProviders('gpt-4o')

    const badBody = {
      async *[Symbol.asyncIterator]() {
        throw new Error('boom')
      },
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      body: badBody,
    } as any)

    const stream = (await OpenAIStream(
      { id: 'gpt-4o', name: 'm', tokenLimit: 1, enabled: true } as any,
      'sys',
      0.1,
      providers,
      [],
      true,
    )) as ReadableStream

    const reader = stream.getReader()
    await expect(reader.read()).rejects.toThrow('boom')
  })
})
