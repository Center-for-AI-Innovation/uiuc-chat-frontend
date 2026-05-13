import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  getCourseMetadata: vi.fn(),
  getKeycloakBaseUrl: vi.fn(() => 'https://kc.example.com/'),
  initializeKeycloakAdmin: vi.fn(),
  find: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('~/pages/api/UIUC-api/getCourseMetadata', () => ({
  getCourseMetadata: hoisted.getCourseMetadata,
}))

vi.mock('~/utils/authHelpers', () => ({
  getKeycloakBaseUrl: hoisted.getKeycloakBaseUrl,
}))

vi.mock('~/utils/keycloakClient', () => ({
  initializeKeycloakAdmin: hoisted.initializeKeycloakAdmin,
}))

import handler from '~/pages/api/UIUC-api/getMaintainerProfiles'

describe('UIUC-api/getMaintainerProfiles', () => {
  beforeEach(() => {
    hoisted.getCourseMetadata.mockReset()
    hoisted.initializeKeycloakAdmin.mockReset()
    hoisted.find.mockReset()
    hoisted.initializeKeycloakAdmin.mockResolvedValue({
      users: { find: hoisted.find },
    })
  })

  it('returns 405 for non-GET', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 400 when course_name is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 404 when the course does not exist', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce(null)
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('builds maintainer profiles from owner + admins (excluding the default admin)', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_owner: 'owner@example.com',
      course_admins: ['alice@example.com', 'rohan13@illinois.edu'],
    })
    hoisted.find.mockImplementation(async ({ email }: { email: string }) => {
      if (email === 'owner@example.com')
        return [{ firstName: 'Owen', lastName: 'Smith' }]
      if (email === 'alice@example.com')
        return [{ firstName: 'Alice', lastName: '' }]
      return []
    })
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.success).toBe(true)
    expect(payload.profiles).toEqual(
      expect.arrayContaining([
        {
          email: 'alice@example.com',
          display_name: 'Alice',
          avatar_url: '',
        },
        {
          email: 'owner@example.com',
          display_name: 'Owen Smith',
          avatar_url: '',
        },
      ]),
    )
    // The default admin email is excluded from the maintainer list.
    expect(
      payload.profiles.some((p: any) => p.email === 'rohan13@illinois.edu'),
    ).toBe(false)
  })

  it('falls back to bare-email profile when keycloak lookup throws or returns nothing', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_owner: 'owner@example.com',
      course_admins: ['alice@example.com'],
    })
    hoisted.find.mockImplementation(async ({ email }: { email: string }) => {
      if (email === 'owner@example.com') return []
      throw new Error('keycloak down for alice')
    })
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const payload = (res.json as any).mock.calls[0][0]
    expect(payload.profiles).toEqual([
      { email: 'alice@example.com' },
      { email: 'owner@example.com' },
    ])
  })

  it('returns 500 when initializeKeycloakAdmin throws', async () => {
    const consoleLog = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_owner: 'owner@example.com',
      course_admins: [],
    })
    hoisted.initializeKeycloakAdmin.mockRejectedValueOnce(new Error('kc down'))
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'GET',
        user: { email: 'me@example.com' },
        query: { course_name: 'CS101' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
    consoleLog.mockRestore()
  })
})
