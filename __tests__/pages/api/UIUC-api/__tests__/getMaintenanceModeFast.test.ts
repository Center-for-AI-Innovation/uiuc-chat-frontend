import { describe, expect, it, vi } from 'vitest'
import handler from '~/pages/api/UIUC-api/getMaintenanceModeFast'
import { ensureRedisConnected } from '~/utils/redisClient'

vi.mock('~/utils/redisClient', () => ({
  ensureRedisConnected: vi.fn(),
}))

function createRes() {
  const res: any = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

describe('getMaintenanceModeFast API', () => {
  it('returns isMaintenanceMode=true when redis value is "true"', async () => {
    ;(
      ensureRedisConnected as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      get: vi.fn().mockResolvedValue('true'),
    })

    const res = createRes()
    await handler({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ isMaintenanceMode: true })
  })

  it('returns isMaintenanceMode=false when redis value is not "true"', async () => {
    ;(
      ensureRedisConnected as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      get: vi.fn().mockResolvedValue('false'),
    })

    const res = createRes()
    await handler({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ isMaintenanceMode: false })
  })

  it('returns 500 when redis fails', async () => {
    ;(
      ensureRedisConnected as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('redis down'))

    const res = createRes()
    await handler({} as any, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to check maintenance mode',
    })
  })
})
