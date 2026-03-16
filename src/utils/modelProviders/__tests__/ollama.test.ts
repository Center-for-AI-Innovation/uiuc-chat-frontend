/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { getOllamaModels, OllamaModelIDs } from '../ollama'

describe('getOllamaModels', () => {
  it('returns empty models when disabled or missing baseUrl', async () => {
    const disabled: any = {
      enabled: false,
      baseUrl: 'http://ollama',
      models: [{ id: 'x' }],
    }
    await expect(getOllamaModels(disabled)).resolves.toMatchObject({
      models: [],
    })

    const missingBaseUrl: any = {
      enabled: true,
      baseUrl: '',
      models: [{ id: 'x' }],
    }
    await expect(getOllamaModels(missingBaseUrl)).resolves.toMatchObject({
      models: [],
    })
  })

  it('sets error and clears models when /api/tags is non-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    const provider: any = {
      enabled: true,
      baseUrl: 'http://ollama',
      models: [{ id: 'x' }],
    }
    const result = await getOllamaModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/http error 500/i)
  })

  it('filters to supported model ids and returns mapped models', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          models: [
            { model: OllamaModelIDs.LLAMA32_1b_fp16 },
            { model: 'unknown-model' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const provider: any = {
      enabled: true,
      baseUrl: 'http://ollama',
      models: [],
    }
    const result = await getOllamaModels(provider)
    expect(result.models?.map((m: any) => m.id)).toEqual([
      OllamaModelIDs.LLAMA32_1b_fp16,
    ])
  })

  it('handles thrown errors by setting error and clearing models', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    const provider: any = {
      enabled: true,
      baseUrl: 'http://ollama',
      models: [{ id: 'x' }],
    }
    const result = await getOllamaModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/boom/i)
  })
})
