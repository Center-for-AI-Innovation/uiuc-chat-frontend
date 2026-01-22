/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { getNCSAHostedModels } from '../NCSAHosted'
import { OllamaModelIDs } from '../ollama'

describe('getNCSAHostedModels', () => {
  it('returns empty models when provider is disabled', async () => {
    const provider: any = { enabled: false, models: [{ id: OllamaModelIDs.GPT_OSS_20B }] }
    const result = await getNCSAHostedModels(provider)
    expect(result.models).toEqual([])
  })

  it('sets error and clears models when fetch is not ok', async () => {
    vi.stubEnv('OLLAMA_SERVER_URL', 'https://ollama.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/http error 500/i)
  })

  it('filters to only downloaded supported model ids and preserves states', async () => {
    vi.stubEnv('OLLAMA_SERVER_URL', 'https://ollama.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          models: [
            { model: OllamaModelIDs.GPT_OSS_20B },
            { model: 'unknown-model' },
          ],
        }),
        { status: 200 },
      ),
    )

    const provider: any = {
      enabled: true,
      models: [{ id: OllamaModelIDs.GPT_OSS_20B, enabled: false, default: true }],
    }
    const result = await getNCSAHostedModels(provider)
    const models = result.models ?? []
    expect(models).toHaveLength(1)
    expect(models[0]).toMatchObject({
      id: OllamaModelIDs.GPT_OSS_20B,
      enabled: false,
      default: true,
    })
  })

  it('handles unexpected non-array models payloads from /api/tags', async () => {
    vi.stubEnv('OLLAMA_SERVER_URL', 'https://ollama.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ models: null }), { status: 200 }),
    )

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedModels(provider)
    expect(result.models).toEqual([])
  })

  it('handles thrown errors by setting error and clearing models', async () => {
    vi.stubEnv('OLLAMA_SERVER_URL', 'https://ollama.example')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    const provider: any = { enabled: true, models: [{ id: OllamaModelIDs.GPT_OSS_20B }] }
    const result = await getNCSAHostedModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/boom/i)
  })
})
