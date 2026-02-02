import { describe, expect, it } from 'vitest'
import { runComponentsSmokeShard } from './smokeAllComponents.shared'

describe('components smoke (bulk) shard 4/6', () => {
  it('imports and renders most components without crashing', async () => {
    await runComponentsSmokeShard(3, 6)
    expect(true).toBe(true)
  }, 120_000)
})
