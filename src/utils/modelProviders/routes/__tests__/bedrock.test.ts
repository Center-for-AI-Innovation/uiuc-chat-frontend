import { describe, expect, it } from 'vitest'
import { getBedrockModels } from '../bedrock'
import { BedrockModelID } from '../../types/bedrock'

describe('getBedrockModels', () => {
  it('returns empty models when missing creds or disabled', async () => {
    const provider: any = {
      enabled: true,
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
    }
    const result = await getBedrockModels(provider)
    expect(result.models).toEqual([])
  })

  it('preserves enabled/default and sorts by preference', async () => {
    const provider: any = {
      enabled: true,
      accessKeyId: 'a',
      secretAccessKey: 's',
      region: 'us-east-1',
      models: [
        { id: BedrockModelID.Claude_3_Opus, enabled: false, default: true },
      ],
    }

    const result = await getBedrockModels(provider)
    expect(result.models?.[0]?.id).toBe(BedrockModelID.Claude_3_5_Sonnet_Latest)
    const models = result.models ?? []
    const opus = models.find((m: any) => m.id === BedrockModelID.Claude_3_Opus)
    expect(opus).toMatchObject({ enabled: false, default: true })
  })
})
