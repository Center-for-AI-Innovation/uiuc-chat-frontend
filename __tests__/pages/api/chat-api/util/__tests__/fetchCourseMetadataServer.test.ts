import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  return { getCourseMetadata: vi.fn() }
})

vi.mock('~/pages/api/UIUC-api/getCourseMetadata', () => ({
  getCourseMetadata: hoisted.getCourseMetadata,
}))

import fetchCourseMetadataServer from '~/pages/api/chat-api/util/fetchCourseMetadataServer'

describe('fetchCourseMetadataServer', () => {
  it('returns course metadata from getCourseMetadata', async () => {
    hoisted.getCourseMetadata.mockResolvedValueOnce({ course_owner: 'x' })
    await expect(fetchCourseMetadataServer('CS101')).resolves.toMatchObject({
      course_owner: 'x',
    })
  })
})
