import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    getCourseMetadata: vi.fn(),
    writeCourseMetadata: vi.fn(async () => undefined),
    encrypt: vi.fn(async () => 'enc'),
    isEncrypted: vi.fn(() => false),
    upsertChatbotTags: vi.fn(async () => undefined),
  }
})

vi.mock('~/pages/api/authorization', () => ({
  withCourseOwnerOrAdminAccess: () => (h: any) => h,
}))

vi.mock('~/pages/api/UIUC-api/getCourseMetadata', () => ({
  getCourseMetadata: hoisted.getCourseMetadata,
}))

vi.mock('~/utils/courseMetadataStore', () => ({
  writeCourseMetadata: hoisted.writeCourseMetadata,
}))

vi.mock('~/utils/superAdmins', () => ({
  superAdmins: ['admin@example.com'],
}))

vi.mock('~/utils/crypto', () => ({
  encrypt: hoisted.encrypt,
  isEncrypted: hoisted.isEncrypted,
}))

vi.mock('~/utils/chatbotTagsRegistry', () => ({
  upsertChatbotTags: hoisted.upsertChatbotTags,
}))

import handler from '~/pages/api/UIUC-api/upsertCourseMetadata'

describe('UIUC-api/upsertCourseMetadata', () => {
  it('returns 400 when courseName is missing', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({ method: 'POST', body: {} }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('combines metadata, encrypts key, and writes to redis', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_admins: [],
      is_private: undefined,
      openai_api_key: 'sk-plain',
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          courseName: 'CS101',
          courseMetadata: { course_owner: 'owner@example.com' },
        },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.encrypt).toHaveBeenCalled()
    expect(hoisted.writeCourseMetadata).toHaveBeenCalledWith(
      'CS101',
      expect.objectContaining({ course_owner: 'owner@example.com' }),
    )
  })

  it('registers newly-added tags into the registry and skips tags that already existed on the previous save', async () => {
    hoisted.upsertChatbotTags.mockClear()
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_admins: ['admin@example.com'],
      is_private: false,
      tags: [
        { category: 'general', value: 'old-tag' },
        { category: 'organization', value: 'Grainger Engineering' },
      ],
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          courseName: 'CS101',
          courseMetadata: {
            course_owner: 'owner@example.com',
            tags: [
              // unchanged
              { category: 'general', value: 'old-tag' },
              { category: 'organization', value: 'Grainger Engineering' },
              // new
              { category: 'general', value: 'new-tag' },
              { category: 'projectType', value: 'Course' },
            ],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.upsertChatbotTags).toHaveBeenCalledTimes(1)
    const registered = hoisted.upsertChatbotTags.mock.calls[0]?.[0]
    expect(registered).toEqual([
      { category: 'general', value: 'new-tag' },
      { category: 'projectType', value: 'Course' },
    ])
  })

  it('does not call the registry when no tags are added', async () => {
    hoisted.upsertChatbotTags.mockClear()
    hoisted.getCourseMetadata.mockResolvedValueOnce({
      course_admins: ['admin@example.com'],
      is_private: false,
      tags: [{ category: 'general', value: 'beta' }],
    })

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: {
          courseName: 'CS101',
          courseMetadata: {
            course_owner: 'owner@example.com',
            tags: [{ category: 'general', value: 'beta' }],
          },
        },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(hoisted.upsertChatbotTags).not.toHaveBeenCalled()
  })
})
