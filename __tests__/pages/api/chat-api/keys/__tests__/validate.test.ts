import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  const selectWhere = vi.fn()
  const selectFrom = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from: selectFrom }))

  const updateWhere = vi.fn()
  const updateSet = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set: updateSet }))

  const client = vi.fn(async (_strings: any, ...values: any[]) => {
    const email = values[0]
    return [{ id: 'id-1', email }]
  })

  return {
    db: { select, update },
    apiKeys: { email: {}, key: {}, is_active: {}, usage_count: {} },
    client,
    selectWhere,
    updateWhere,
  }
})

vi.mock('~/db/dbClient', () => ({
  db: hoisted.db,
  apiKeys: hoisted.apiKeys,
  client: hoisted.client,
}))

vi.mock('~/db/schema', () => ({
  keycloakUsers: { email: {} },
}))

vi.mock('drizzle-orm', () => ({
  and: () => ({}),
  eq: () => ({}),
  sql: (strings: any, ...values: any[]) => ({ strings, values }),
}))

import handler, { validateApiKeyAndRetrieveData } from '~/pages/api/chat-api/keys/validate'

describe('chat-api/keys/validate', () => {
  it('validateApiKeyAndRetrieveData returns invalid when key not found', async () => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    hoisted.selectWhere.mockResolvedValueOnce([])
    const out = await validateApiKeyAndRetrieveData('k')
    expect(out.isValidApiKey).toBe(false)
    expect(out.authContext.isAuthenticated).toBe(false)
  })

  it('validateApiKeyAndRetrieveData throws when email or user is missing', async () => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    hoisted.selectWhere.mockResolvedValueOnce([{ email: null }])
    await expect(validateApiKeyAndRetrieveData('k')).rejects.toThrow(
      /Email not found/,
    )

    hoisted.selectWhere.mockResolvedValueOnce([{ email: 'a@b.com' }])
    hoisted.client.mockResolvedValueOnce([])
    await expect(validateApiKeyAndRetrieveData('k')).rejects.toThrow(
      /User not found/,
    )
  })

  it('validateApiKeyAndRetrieveData returns authenticated context on success', async () => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    hoisted.selectWhere.mockResolvedValueOnce([{ email: 'a@b.com' }])
    hoisted.client.mockResolvedValueOnce([{ id: '123', email: 'a@b.com' }])
    hoisted.updateWhere.mockResolvedValueOnce(undefined)
    const out = await validateApiKeyAndRetrieveData('k')
    expect(out.isValidApiKey).toBe(true)
    expect(out.authContext.isAuthenticated).toBe(true)
    expect(out.authContext.user?.profile.email).toBe('a@b.com')
  })

  it('handler returns 403 for invalid key and 200 for valid', async () => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'
    hoisted.selectWhere.mockResolvedValueOnce([])
    const req1 = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ api_key: 'k', course_name: 'CS101' }),
    })
    const r1 = await handler(req1 as any)
    expect(r1.status).toBe(403)

    hoisted.selectWhere.mockResolvedValueOnce([{ email: 'a@b.com' }])
    hoisted.client.mockResolvedValueOnce([{ id: '123', email: 'a@b.com' }])
    hoisted.updateWhere.mockResolvedValueOnce(undefined)
    const req2 = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ api_key: 'k', course_name: 'CS101' }),
    })
    const r2 = await handler(req2 as any)
    expect(r2.status).toBe(200)
    const body = await r2.json()
    expect(body.authContext?.isAuthenticated).toBe(true)
  })
})

