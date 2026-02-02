import { describe, expect, it } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'
import handler from '~/pages/api/UIUC-api/isSignedIn'

describe('UIUC-api/isSignedIn', () => {
  it('returns 401 when authorization missing or token missing', async () => {
    const res1 = createMockRes()
    await handler(createMockReq({ headers: {} }) as any, res1 as any)
    expect(res1.status).toHaveBeenCalledWith(401)

    const res2 = createMockRes()
    await handler(
      createMockReq({ headers: { authorization: 'Bearer ' } }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(401)
  })

  it('returns 200 with userId when token is present', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ headers: { authorization: 'Bearer token' } }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

