/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  getSignedUrl: vi.fn(),
  getS3Client: vi.fn(async () => ({
    client: { name: 's3' },
    bucket: 'default-bucket',
    endpoint: null,
    region: 'us-east-1',
  })),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: hoisted.getSignedUrl,
}))

vi.mock('~/utils/connectionManager', () => ({
  connectionManager: { getS3Client: hoisted.getS3Client },
}))

import handler from '~/pages/api/download'

describe('download API', () => {
  it('returns 200 with presigned url', async () => {
    hoisted.getSignedUrl.mockResolvedValueOnce('https://example.com/url')

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { filePath: 'path/file.pdf', courseName: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/url' }),
    )
  })

  it('routes through ConnectionManager for any course (no hardcoded vyriad branching)', async () => {
    hoisted.getSignedUrl.mockResolvedValueOnce('https://example.com/anycourse')

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { filePath: 'folder/file.png', courseName: 'vyriad' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 404 when getSignedUrl throws NoSuchKey', async () => {
    hoisted.getSignedUrl.mockRejectedValueOnce(
      Object.assign(new Error('missing'), { name: 'NoSuchKey' }),
    )

    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { filePath: 'path/missing.pdf', courseName: 'CS101' },
      }) as any,
      res as any,
    )

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
