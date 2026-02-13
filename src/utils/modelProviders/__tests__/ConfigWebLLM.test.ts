import { describe, expect, it } from 'vitest'

import {
  functionCallingModelIds,
  modelLibURLPrefix,
  modelVersion,
  prebuiltAppConfig,
  recommendedModelIds,
  warningLargeModelIds,
} from '../ConfigWebLLM'

describe('ConfigWebLLM', () => {
  it('exports stable config metadata', () => {
    expect(modelVersion).toMatch(/^v\d+_/)
    expect(modelLibURLPrefix).toContain('githubusercontent.com')
    expect(Array.isArray(functionCallingModelIds)).toBe(true)
    expect(Array.isArray(recommendedModelIds)).toBe(true)
    expect(Array.isArray(warningLargeModelIds)).toBe(true)
  })

  it('prebuiltAppConfig contains a model_list', () => {
    expect(prebuiltAppConfig.useIndexedDBCache).toBe(false)
    expect(Array.isArray(prebuiltAppConfig.model_list)).toBe(true)
    expect(prebuiltAppConfig.model_list.length).toBeGreaterThan(0)
    expect(prebuiltAppConfig.model_list[0]).toHaveProperty('model_id')
    expect(prebuiltAppConfig.model_list[0]).toHaveProperty('model_lib')
  })
})
