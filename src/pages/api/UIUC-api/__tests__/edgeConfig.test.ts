/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('~/utils/authMiddleware', () => ({
  withAuth: (fn: any) => fn,
}))

const hoisted = vi.hoisted(() => ({
  axiosPatch: vi.fn(),
}))

vi.mock('axios', async () => {
  return {
    default: {
      patch: hoisted.axiosPatch,
    },
  }
})

import { addConfigV2, addEdgeConfigItem } from '../addCourseEdgeConfig'

describe('UIUC-api edge config helpers', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    hoisted.axiosPatch.mockReset()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  it('addEdgeConfigItem PATCHes EDGE_CONFIG and swallows errors', async () => {
    process.env.EDGE_CONFIG = 'https://edge.example'
    process.env.VERCEL_API_TOKEN = 'token'

    const fetchMock = vi.fn(async () => ({
      json: vi.fn(async () => ({ ok: true })),
    }))
    vi.stubGlobal('fetch', fetchMock as any)

    await expect(addEdgeConfigItem('CS101')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://edge.example/items',
      expect.objectContaining({ method: 'PATCH' }),
    )

    ;(fetchMock as any).mockRejectedValueOnce(new Error('boom'))
    await expect(addEdgeConfigItem('CS101')).resolves.toBeUndefined()
  })

  it('addConfigV2 returns response.data and returns [] on errors', async () => {
    process.env.EDGE_CONFIG = 'https://edge.example'

    hoisted.axiosPatch.mockResolvedValueOnce({ data: { ok: true } })
    await expect(addConfigV2('CS101')).resolves.toEqual({ ok: true })

    hoisted.axiosPatch.mockRejectedValueOnce(new Error('boom'))
    await expect(addConfigV2('CS101')).resolves.toEqual([])
  })
})

