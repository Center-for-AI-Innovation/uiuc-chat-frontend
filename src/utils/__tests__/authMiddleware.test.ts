/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import jwt from 'jsonwebtoken'

function makeRes() {
  const res: any = {}
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  })
  res.json = vi.fn((body: any) => {
    res.body = body
    return res
  })
  return res
}

describe('authMiddleware', () => {
  it('withAuth returns 401 when token is missing', async () => {
    vi.doMock('../keycloakClient', () => ({
      verifyTokenAsync: vi.fn(),
    }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAuth } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withAuth(handler as any)
    const req: any = { cookies: {}, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('withAuth attaches user and calls handler when token verifies', async () => {
    const verifyTokenAsync = vi.fn().mockResolvedValue({ sub: 'u1' })
    const getKeycloakBaseFromHost = vi.fn(() => 'https://kc/')
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({ getKeycloakBaseFromHost }))

    vi.resetModules()
    const { withAuth } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withAuth(handler as any)
    const req: any = {
      cookies: { access_token: 't' },
      headers: { host: 'example.com:3000' },
    }
    const res = makeRes()

    await wrapped(req, res)
    expect(getKeycloakBaseFromHost).toHaveBeenCalledWith('example.com')
    expect(verifyTokenAsync).toHaveBeenCalledWith('t', 'https://kc/')
    expect(req.user).toEqual({ sub: 'u1' })
    expect(handler).toHaveBeenCalledWith(req, res)
  })

  it('withAuth returns TokenExpiredError as 401 token expired', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi
      .fn()
      .mockRejectedValue(
        new (jwt as any).TokenExpiredError('expired', new Date()),
      )
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAuth } = await import('../authMiddleware')

    const wrapped = withAuth((() => {}) as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toMatchObject({ error: 'Token expired' })
  })

  it('withAuth returns JsonWebTokenError as 401 invalid token', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi
      .fn()
      .mockRejectedValue(new (jwt as any).JsonWebTokenError('bad token'))
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAuth } = await import('../authMiddleware')

    const wrapped = withAuth((() => {}) as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toMatchObject({ error: 'Invalid token' })
  })

  it('withAuth returns 401 authentication failed for unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const verifyTokenAsync = vi.fn().mockRejectedValue(new Error('boom'))
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAuth } = await import('../authMiddleware')

    const wrapped = withAuth((() => {}) as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toMatchObject({ error: 'Authentication failed' })
  })

  it('hasRole/hasAnyRole check roles', async () => {
    const { hasAnyRole, hasRole } = await import('../authMiddleware')
    const user: any = { realm_access: { roles: ['a', 'b'] } }
    expect(hasRole(user, 'a')).toBe(true)
    expect(hasRole(user, 'c')).toBe(false)
    expect(hasAnyRole(user, ['c', 'b'])).toBe(true)
    expect(hasAnyRole(user, ['c'])).toBe(false)
  })

  it('withRole returns 403 when role missing', async () => {
    const verifyTokenAsync = vi
      .fn()
      .mockResolvedValue({ realm_access: { roles: [] } })
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withRole('admin')(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ error: 'Insufficient permissions' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('withRole returns 401 when user is not authenticated', async () => {
    const verifyTokenAsync = vi.fn().mockResolvedValue(undefined)
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withRole('admin')(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toMatchObject({ error: 'User not authenticated' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('withRole calls handler when role is present', async () => {
    const verifyTokenAsync = vi
      .fn()
      .mockResolvedValue({ realm_access: { roles: ['admin'] } })
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withRole('admin')(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(handler).toHaveBeenCalled()
  })

  it('withAnyRole calls handler when user has one role', async () => {
    const verifyTokenAsync = vi
      .fn()
      .mockResolvedValue({ realm_access: { roles: ['x'] } })
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAnyRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withAnyRole(['x', 'y'])(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(handler).toHaveBeenCalled()
  })

  it('withAnyRole returns 401 when user is not authenticated', async () => {
    const verifyTokenAsync = vi.fn().mockResolvedValue(undefined)
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAnyRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withAnyRole(['a'])(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toMatchObject({ error: 'User not authenticated' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('withAnyRole returns 403 when none of the required roles are present', async () => {
    const verifyTokenAsync = vi
      .fn()
      .mockResolvedValue({ realm_access: { roles: [] } })
    vi.doMock('../keycloakClient', () => ({ verifyTokenAsync }))
    vi.doMock('~/utils/authHelpers', () => ({
      getKeycloakBaseFromHost: vi.fn(() => 'https://kc/'),
    }))

    vi.resetModules()
    const { withAnyRole } = await import('../authMiddleware')

    const handler = vi.fn()
    const wrapped = withAnyRole(['a', 'b'])(handler as any)
    const req: any = { cookies: { access_token: 't' }, headers: {} }
    const res = makeRes()

    await wrapped(req, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ error: 'Insufficient permissions' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('isPublicEndpoint matches known prefixes', async () => {
    const { isPublicEndpoint } = await import('../authMiddleware')
    expect(isPublicEndpoint('/api/healthcheck')).toBe(true)
    expect(isPublicEndpoint('/api/auth/logout')).toBe(true)
    expect(isPublicEndpoint('/api/private')).toBe(false)
  })
})
