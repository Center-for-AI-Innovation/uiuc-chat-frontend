/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

import { getNCSAHostedVLMModels, NCSAHostedVLMModelID } from '../NCSAHostedVLM'

describe('getNCSAHostedVLMModels', () => {
  it('returns empty models when disabled', async () => {
    const provider: any = {
      enabled: false,
      models: [{ id: NCSAHostedVLMModelID.MOLMO_7B_D_0924 }],
    }
    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([])
  })

  it('sets offline error when status is 530', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('offline', { status: 530, statusText: 'offline' }),
    )

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toBe('Model is offline')
  })

  it('sets HTTP error when status is not ok and not 530', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([])
    expect(result.error).toMatch(/http error 500/i)
  })

  it('maps known and unknown models and preserves states', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            { id: NCSAHostedVLMModelID.MOLMO_7B_D_0924, max_tokens: 123 },
            { id: 'unknown/model', max_tokens: 999 },
          ],
        }),
        { status: 200 },
      ),
    )

    const provider: any = {
      enabled: true,
      models: [
        {
          id: NCSAHostedVLMModelID.MOLMO_7B_D_0924,
          enabled: false,
          default: true,
        },
      ],
    }

    const result = await getNCSAHostedVLMModels(provider)
    expect(result.baseUrl).toBe('https://vlm.example')
    const models = result.models ?? []
    expect(models).toHaveLength(2)
    const known = models.find(
      (m: any) => m.id === NCSAHostedVLMModelID.MOLMO_7B_D_0924,
    )
    expect(known).toMatchObject({
      enabled: false,
      default: true,
      tokenLimit: 123,
    })
    const unknown = models.find((m: any) => m.id === 'unknown/model')
    expect(unknown).toBeTruthy()
    expect(unknown!.name).toMatch(/^Experimental:/)
    expect(unknown!.tokenLimit).toBe(999)
  })

  it('handles thrown errors by clearing models', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([])
  })
})
