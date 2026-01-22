import { describe, expect, it } from 'vitest'
import { PluginID, type Plugin } from '~/types/plugin'
import { getEndpoint } from '../api'

describe('getEndpoint', () => {
  it('uses chat endpoint when no plugin provided', () => {
    expect(getEndpoint(null)).toBe('../api/chat')
  })

  it('routes google search plugin to google endpoint', () => {
    const plugin: Plugin = {
      id: PluginID.GOOGLE_SEARCH,
      name: 'Google Search' as any,
      requiredKeys: [],
    }
    expect(getEndpoint(plugin)).toBe('../api/google')
  })

  it('defaults unknown plugins to chat endpoint', () => {
    const plugin: Plugin = {
      id: 'unknown' as any,
      name: 'Unknown' as any,
      requiredKeys: [],
    }
    expect(getEndpoint(plugin)).toBe('../api/chat')
  })
})
