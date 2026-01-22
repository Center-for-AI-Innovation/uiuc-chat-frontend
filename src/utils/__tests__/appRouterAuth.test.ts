/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

describe('withAppRouterAuth', () => {
  it('returns 401 when token cookie is missing', async () => {
    vi.doMock('../keycloakClient', () => ({
      verifyTokenAsync: vi.fn(),
    }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAppRouterAuth } = await import('../appRouterAuth')

    const handler = vi.fn(() => NextResponse.json({ ok: true }))
    const wrapped = withAppRouterAuth(handler as any)

    const req: any = { headers: new Headers() }
    const res = await wrapped(req)
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Missing token' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('attaches user and calls handler when token verifies', async () => {
    const verifyTokenAsync = vi.fn().mockResolvedValue({ sub: 'u1' })
    const getKeycloakBaseFromHost = vi.fn(() => 'https://kc/')
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({ getKeycloakBaseFromHost }))

    vi.resetModules()
    const { withAppRouterAuth } = await import('../appRouterAuth')

    const handler = vi.fn((req: any) => NextResponse.json({ user: req.user }))
    const wrapped = withAppRouterAuth(handler as any)

    const req: any = {
      headers: new Headers({
        cookie: 'access_token=t',
        host: 'example.com:3000',
      }),
    }

    const res = await wrapped(req)
    expect(getKeycloakBaseFromHost).toHaveBeenCalledWith('example.com')
    expect(verifyTokenAsync).toHaveBeenCalledWith('t', 'https://kc/')
    await expect(res.json()).resolves.toMatchObject({ user: { sub: 'u1' } })
  })

  it('returns 401 TokenExpiredError when token is expired', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi
      .fn()
      .mockRejectedValue(new (jwt as any).TokenExpiredError('expired', new Date()))
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAppRouterAuth } = await import('../appRouterAuth')

    const wrapped = withAppRouterAuth((() => NextResponse.json({ ok: true })) as any)
    const req: any = {
      headers: new Headers({ cookie: 'access_token=t' }),
    }
    const res = await wrapped(req)
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Token expired' })
  })

  it('returns 401 JsonWebTokenError when token is invalid', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi
      .fn()
      .mockRejectedValue(new (jwt as any).JsonWebTokenError('bad token'))
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAppRouterAuth } = await import('../appRouterAuth')

    const wrapped = withAppRouterAuth((() => NextResponse.json({ ok: true })) as any)
    const req: any = {
      headers: new Headers({ cookie: 'access_token=t' }),
    }
    const res = await wrapped(req)
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid token' })
  })

  it('returns 401 authentication failed for unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi.fn().mockRejectedValue(new Error('boom'))
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAppRouterAuth } = await import('../appRouterAuth')

    const wrapped = withAppRouterAuth((() => NextResponse.json({ ok: true })) as any)
    const req: any = {
      headers: new Headers({ cookie: 'access_token=t' }),
    }
    const res = await wrapped(req)
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Authentication failed' })
  })
})
