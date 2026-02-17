/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

describe('keycloakClient', () => {
  it('initializeKeycloakAdmin caches the client and authenticates when secret is set', async () => {
    vi.stubEnv('KEYCLOAK_CLIENT_SECRET', 'secret')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_REALM', 'realm')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_CLIENT_ID', 'client')

    const auth = vi.fn().mockResolvedValue(undefined)
    const ctor = vi.fn().mockImplementation(() => ({
      auth,
      users: { findOne: vi.fn(), listRoleMappings: vi.fn() },
      realms: { findOne: vi.fn() },
    }))
    vi.doMock('@keycloak/keycloak-admin-client', () => ({ default: ctor }))

    vi.resetModules()
    const { initializeKeycloakAdmin } = await import('../keycloakClient')

    const c1 = await initializeKeycloakAdmin('https://kc/')
    const c2 = await initializeKeycloakAdmin('https://kc/')
    expect(c1).toBe(c2)
    expect(auth).toHaveBeenCalledWith(
      expect.objectContaining({
        grantType: 'client_credentials',
        clientId: 'client',
        clientSecret: 'secret',
      }),
    )
  })

  it('getSigningKey returns an error when kid is missing', async () => {
    vi.resetModules()
    const { getSigningKey } = await import('../keycloakClient')
    const cb = vi.fn()
    getSigningKey('https://kc/', {}, cb)
    expect(cb).toHaveBeenCalledWith(expect.any(Error))
  })

  it('getSigningKey passes through jwks-rsa errors', async () => {
    const getSigningKeyMock = vi.fn((_kid: string, cb: any) =>
      cb(new Error('jwks fail')),
    )
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: getSigningKeyMock }),
    }))

    vi.resetModules()
    const { getSigningKey } = await import('../keycloakClient')

    const cb = vi.fn()
    getSigningKey('https://kc/', { kid: 'kid1' }, cb)
    expect(getSigningKeyMock).toHaveBeenCalled()
    expect(cb).toHaveBeenCalledWith(expect.any(Error))
  })

  it('getSigningKey resolves signing key via jwks-rsa', async () => {
    const getSigningKeyMock = vi.fn((_kid: string, cb: any) =>
      cb(null, { getPublicKey: () => 'PUBLIC_KEY' }),
    )
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: getSigningKeyMock }),
    }))

    vi.resetModules()
    const { getSigningKey } = await import('../keycloakClient')

    const cb = vi.fn()
    getSigningKey('https://kc/', { kid: 'kid1' }, cb)
    expect(cb).toHaveBeenCalledWith(null, 'PUBLIC_KEY')
  })

  it('fetchRealmPublicKey returns a certificate when JWKS has x5c', async () => {
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { fetchRealmPublicKey, getJwksUri } = await import(
      '../keycloakClient'
    )

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [{ x5c: ['CERTDATA'] }] }), {
        status: 200,
      }),
    )

    const cert = await fetchRealmPublicKey('https://kc/')
    expect(cert).toContain('BEGIN CERTIFICATE')
    expect(cert).toContain('CERTDATA')
    expect(getJwksUri('https://kc/')).toContain(
      '/protocol/openid-connect/certs',
    )
  })

  it('fetchRealmPublicKey returns null when JWKS response is not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { fetchRealmPublicKey } = await import('../keycloakClient')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    await expect(fetchRealmPublicKey('https://kc/')).resolves.toBeNull()
  })

  it('fetchRealmPublicKey returns null when JWKS has no keys', async () => {
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { fetchRealmPublicKey } = await import('../keycloakClient')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [] }), { status: 200 }),
    )

    await expect(fetchRealmPublicKey('https://kc/')).resolves.toBeNull()
  })

  it('getOpenIdConfig throws when response is not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.resetModules()
    const { getOpenIdConfig } = await import('../keycloakClient')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('nope', { status: 500, statusText: 'fail' }),
    )

    await expect(getOpenIdConfig('https://kc/')).rejects.toThrow(/fail/i)
  })

  it('createTokenVerifier throws when base url is missing', async () => {
    vi.resetModules()
    const { createTokenVerifier } = await import('../keycloakClient')
    expect(() => createTokenVerifier(undefined)).toThrow(/required/i)
  })

  it('verifyTokenAsync resolves decoded token and rejects on error', async () => {
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const jwt = (await import('jsonwebtoken')).default as any
    const { verifyTokenAsync } = await import('../keycloakClient')

    const verifySpy = vi
      .spyOn(jwt, 'verify')
      .mockImplementation((_t: any, _k: any, _o: any, cb: any) =>
        cb(null, { sub: 'u1' }),
      )
    await expect(verifyTokenAsync('t', 'https://kc/')).resolves.toEqual({
      sub: 'u1',
    })

    verifySpy.mockImplementation((_t: any, _k: any, _o: any, cb: any) =>
      cb(new Error('bad')),
    )
    await expect(verifyTokenAsync('t', 'https://kc/')).rejects.toThrow(/bad/i)
  })

  it('userHasRole returns false on errors', async () => {
    vi.stubEnv('KEYCLOAK_CLIENT_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_REALM', 'realm')

    const listRoleMappings = vi.fn().mockRejectedValue(new Error('boom'))
    const ctor = vi.fn().mockImplementation(() => ({
      auth: vi.fn(),
      users: { listRoleMappings },
      realms: { findOne: vi.fn() },
    }))
    vi.doMock('@keycloak/keycloak-admin-client', () => ({ default: ctor }))
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { userHasRole } = await import('../keycloakClient')

    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(userHasRole('https://kc/', 'u', 'r')).resolves.toBe(false)
  })

  it('checkKeycloakHealth returns healthy when OpenID config loads', async () => {
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { checkKeycloakHealth } = await import('../keycloakClient')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ issuer: 'iss', jwks_uri: 'jwks' }), {
        status: 200,
      }),
    )

    await expect(checkKeycloakHealth('https://kc/')).resolves.toMatchObject({
      status: 'healthy',
      details: expect.objectContaining({ issuer: 'iss', jwks_uri: 'jwks' }),
    })
  })

  it('getUserInfo/getUserRoles/getRealmInfo use the admin client', async () => {
    vi.stubEnv('KEYCLOAK_CLIENT_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_REALM', 'realm')

    const users = {
      findOne: vi.fn().mockResolvedValue({ id: 'u1' }),
      listRoleMappings: vi.fn().mockResolvedValue([{ name: 'admin' }]),
    }
    const realms = { findOne: vi.fn().mockResolvedValue({ realm: 'realm' }) }
    const ctor = vi.fn().mockImplementation(() => ({
      auth: vi.fn(),
      users,
      realms,
    }))
    vi.doMock('@keycloak/keycloak-admin-client', () => ({ default: ctor }))
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { getUserInfo, getUserRoles, getRealmInfo, userHasRole } =
      await import('../keycloakClient')

    await expect(getUserInfo('https://kc/', 'u1')).resolves.toEqual({
      id: 'u1',
    })
    await expect(getUserRoles('https://kc/', 'u1')).resolves.toEqual([
      { name: 'admin' },
    ])
    await expect(getRealmInfo('https://kc/')).resolves.toEqual({
      realm: 'realm',
    })
    await expect(userHasRole('https://kc/', 'u1', 'admin')).resolves.toBe(true)
    await expect(userHasRole('https://kc/', 'u1', 'missing')).resolves.toBe(
      false,
    )
  })

  it('getUserInfo logs and rethrows on errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('KEYCLOAK_CLIENT_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_REALM', 'realm')

    const users = {
      findOne: vi.fn().mockRejectedValue(new Error('boom')),
      listRoleMappings: vi.fn(),
    }
    const realms = { findOne: vi.fn() }
    const ctor = vi.fn().mockImplementation(() => ({
      auth: vi.fn(),
      users,
      realms,
    }))
    vi.doMock('@keycloak/keycloak-admin-client', () => ({ default: ctor }))
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { getUserInfo } = await import('../keycloakClient')
    await expect(getUserInfo('https://kc/', 'u1')).rejects.toThrow(/boom/i)
  })

  it('getRealmInfo logs and rethrows on errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('KEYCLOAK_CLIENT_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_KEYCLOAK_REALM', 'realm')

    const users = { findOne: vi.fn(), listRoleMappings: vi.fn() }
    const realms = { findOne: vi.fn().mockRejectedValue(new Error('boom')) }
    const ctor = vi.fn().mockImplementation(() => ({
      auth: vi.fn(),
      users,
      realms,
    }))
    vi.doMock('@keycloak/keycloak-admin-client', () => ({ default: ctor }))
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { getRealmInfo } = await import('../keycloakClient')
    await expect(getRealmInfo('https://kc/')).rejects.toThrow(/boom/i)
  })

  it('checkKeycloakHealth returns unhealthy when OpenID config fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.doMock('jwks-rsa', () => ({
      default: () => ({ getSigningKey: vi.fn() }),
    }))

    vi.resetModules()
    const { checkKeycloakHealth } = await import('../keycloakClient')

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(checkKeycloakHealth('https://kc/')).resolves.toMatchObject({
      status: 'unhealthy',
      error: 'boom',
    })
  })
})
