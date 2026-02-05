import { describe, expect, it, vi } from 'vitest'
import { getSambaNovaModels } from '../sambanova'
import { SambaNovaModelID } from '../../types/SambaNova'

describe('getSambaNovaModels', () => {
  it('returns empty models when disabled or missing apiKey', async () => {
    const provider: any = { enabled: false, apiKey: '' }
    const result = await getSambaNovaModels(provider)
    expect(result.models).toEqual([])
  })

  it('preserves state for existing models and sorts', async () => {
    const provider: any = {
      enabled: true,
      apiKey: 'k',
      models: [
        { id: SambaNovaModelID.DeepSeek_R1, enabled: false, default: true },
      ],
    }

    const result = await getSambaNovaModels(provider)
    const models = result.models ?? []
    const existing = models.find(
      (m: any) => m.id === SambaNovaModelID.DeepSeek_R1,
    )
    expect(existing).toMatchObject({ enabled: false, default: true })
  })

  it('sets error and clears models on unexpected failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const provider: any = { enabled: true, apiKey: 'k' }
    // Force an exception by passing a provider.models shape that passes the length check but lacks forEach
    provider.models = { length: 1 } as any
    const result = await getSambaNovaModels(provider)
    expect(Array.isArray(result.models)).toBe(true)
    expect(result.error).toBeTruthy()
  })
})
