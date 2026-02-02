import { describe, expect, it, vi } from 'vitest'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'
import { AzureModelID, getAzureModels } from '../azure'

describe('getAzureModels', () => {
  it('returns provider with empty models when missing endpoint/apiKey or disabled', async () => {
    const provider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: 'k',
      AzureEndpoint: '',
      models: [{ id: AzureModelID.GPT_4o, enabled: true }],
    } as any

    const out = await getAzureModels(provider)
    expect(out.models).toEqual([])
  })

  it('sets error and clears models when Azure deployments request is non-ok', async () => {
    const provider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: 'k',
      AzureEndpoint: 'https://azure.example.com',
      models: [{ id: AzureModelID.GPT_4o, enabled: true }],
    } as any

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 401, statusText: 'Unauthorized' }),
    )

    const out = await getAzureModels(provider)
    expect(out.models).toEqual([])
    expect(out.error).toMatch(/Azure OpenAI failed to fetch models/)
  })

  it('maps deployments to known Azure models and synthesizes gpt-5-thinking for gpt-5 deployments', async () => {
    const provider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: 'k',
      AzureEndpoint: 'https://azure.example.com/',
      models: [
        // Preserve overrides from existing config
        { id: AzureModelID.GPT_4o, enabled: false, default: true, temperature: 0.3 },
      ],
    } as any

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            { id: 'dep-gpt5', model: 'gpt-5' },
            { id: 'dep-4o', model: 'gpt-4o' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const out = await getAzureModels(provider)
    const ids = (out.models || []).map((m: any) => m.id)

    // Preferred order puts GPT-5 thinking first when available.
    expect(ids[0]).toBe(AzureModelID.GPT_5_thinking)
    expect(ids).toContain(AzureModelID.GPT_5)
    expect(ids).toContain(AzureModelID.GPT_4o)

    const gpt5 = (out.models || []).find((m: any) => m.id === AzureModelID.GPT_5)
    const gpt5Thinking = (out.models || []).find(
      (m: any) => m.id === AzureModelID.GPT_5_thinking,
    )
    expect(gpt5.azureDeploymentID).toBe('dep-gpt5')
    expect(gpt5Thinking.azureDeploymentID).toBe('dep-gpt5')

    const gpt4o = (out.models || []).find((m: any) => m.id === AzureModelID.GPT_4o)
    expect(gpt4o.enabled).toBe(false)
    expect(gpt4o.default).toBe(true)
    expect(gpt4o.temperature).toBe(0.3)
  })

  it('handles fetch errors by setting provider.error and clearing models', async () => {
    const provider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: 'k',
      AzureEndpoint: 'https://azure.example.com',
      models: [{ id: AzureModelID.GPT_4o, enabled: true }],
    } as any

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))
    const out = await getAzureModels(provider)
    expect(out.models).toEqual([])
    expect(out.error).toBe('boom')
  })
})

