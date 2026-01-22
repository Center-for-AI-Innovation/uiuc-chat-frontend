import { describe, expect, it } from 'vitest'
import { getAnthropicModels } from '../anthropic'
import { AnthropicModelID } from '../../types/anthropic'

describe('getAnthropicModels', () => {
  it('returns empty models when disabled or missing api key', async () => {
    const provider: any = { enabled: false, apiKey: '', models: [{ id: 'x' }] }
    const result = await getAnthropicModels(provider)
    expect(result.models).toEqual([])
  })

  it('preserves enabled/default/temperature for existing models and sorts by preference', async () => {
    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [{ id: AnthropicModelID.Claude_3_5_Sonnet, enabled: false, default: true, temperature: 0.7 }],
    }

    const result = await getAnthropicModels(provider)
    expect(result.models?.[0]?.id).toBe(AnthropicModelID.Claude_Sonnet_4)
    const models = result.models ?? []
    const existing = models.find((m: any) => m.id === AnthropicModelID.Claude_3_5_Sonnet)
    expect(existing).toMatchObject({ enabled: false, default: true, temperature: 0.7 })
  })
})
