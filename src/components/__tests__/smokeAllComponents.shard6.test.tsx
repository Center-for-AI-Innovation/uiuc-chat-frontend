import { describe, expect, it } from 'vitest'
import { runComponentsSmokeShard } from './smokeAllComponents.shared'

describe('components smoke (bulk) shard 6/6', () => {
  it('imports and renders most components without crashing', async () => {
    await runComponentsSmokeShard(5, 6)
    expect(true).toBe(true)
  }, 120_000)
})
