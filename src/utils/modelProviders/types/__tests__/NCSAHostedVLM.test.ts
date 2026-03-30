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
            {
              id: NCSAHostedVLMModelID.QWEN3_5_27B,
              max_model_len: 262144,
            },
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
          id: NCSAHostedVLMModelID.QWEN3_5_27B,
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
      (m: any) => m.id === NCSAHostedVLMModelID.QWEN3_5_27B,
    )
    expect(known).toMatchObject({
      name: 'Qwen 3.5 27B',
      enabled: false,
      default: true,
      tokenLimit: 262144,
    })
    const unknown = models.find((m: any) => m.id === 'unknown/model')
    expect(unknown).toBeTruthy()
    expect(unknown!.name).toMatch(/^Experimental:/)
    expect(unknown!.tokenLimit).toBe(999)
  })

  it('skips malformed unknown models that do not advertise a token limit', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [{ id: 'unknown/model' }],
        }),
        { status: 200 },
      ),
    )

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedVLMModels(provider)

    expect(result.models).toEqual([])
    expect(warnSpy).toHaveBeenCalledWith(
      'Skipping VLM model without token limit metadata:',
      'unknown/model',
    )
  })

  it('migrates the legacy default model state to Qwen 3.5 27B', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: NCSAHostedVLMModelID.QWEN3_5_27B,
              max_model_len: 262144,
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const provider: any = {
      enabled: true,
      models: [
        {
          id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
          enabled: true,
          default: true,
        },
      ],
    }

    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([
      expect.objectContaining({
        id: NCSAHostedVLMModelID.QWEN3_5_27B,
        default: true,
        enabled: true,
      }),
    ])
  })

  it('keeps the legacy admin default when Qwen 3.5 is not advertised yet', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
              max_model_len: 23000,
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const provider: any = {
      enabled: true,
      models: [
        {
          id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
          enabled: true,
          default: true,
        },
      ],
    }

    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([
      expect.objectContaining({
        id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
        default: true,
        enabled: true,
      }),
    ])
  })

  it('preserves the migrated default when Qwen 3.5 27B already exists', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.stubEnv('NCSA_HOSTED_API_KEY', 'k')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: NCSAHostedVLMModelID.QWEN3_5_27B,
              max_model_len: 262144,
            },
            {
              id: NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT,
              max_model_len: 23000,
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const provider: any = {
      enabled: true,
      models: [
        {
          id: NCSAHostedVLMModelID.QWEN2_5VL_32B_INSTRUCT,
          enabled: true,
          default: true,
        },
        {
          id: NCSAHostedVLMModelID.QWEN3_5_27B,
          enabled: false,
          default: false,
        },
      ],
    }

    const result = await getNCSAHostedVLMModels(provider)
    const models = result.models ?? []
    expect(
      models.find((m) => m.id === NCSAHostedVLMModelID.QWEN3_5_27B),
    ).toMatchObject({
      enabled: true,
      default: true,
    })
    expect(
      models.find((m) => m.id === NCSAHostedVLMModelID.QWEN2_5VL_72B_INSTRUCT),
    ).toMatchObject({
      default: false,
    })
  })

  it('handles thrown errors by clearing models', async () => {
    vi.stubEnv('NCSA_HOSTED_VLM_BASE_URL', 'https://vlm.example')
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    const provider: any = { enabled: true, models: [] }
    const result = await getNCSAHostedVLMModels(provider)
    expect(result.models).toEqual([])
  })
})
