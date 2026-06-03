/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => ({
  createPresignedPost: vi.fn(),
  getSignedUrl: vi.fn(),
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (handler: any) => handler,
}))

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: hoisted.createPresignedPost,
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: hoisted.getSignedUrl,
}))

const cmHoisted = vi.hoisted(() => ({
  getS3Client: vi.fn(async () => ({
    client: {},
    bucket: 'default-bucket',
    endpoint: null,
    region: 'us-east-1',
  })),
}))

vi.mock('~/utils/connectionManager', () => ({
  connectionManager: { getS3Client: cmHoisted.getS3Client },
}))

import getPresignedUrlHandler from '~/pages/api/UIUC-api/getPresignedUrl'
import uploadToS3Handler from '~/pages/api/UIUC-api/uploadToS3'

describe('UIUC-api S3 routes', () => {
  beforeEach(() => {
    hoisted.createPresignedPost.mockReset()
    hoisted.getSignedUrl.mockReset()
    cmHoisted.getS3Client.mockClear()
    cmHoisted.getS3Client.mockImplementation(async () => ({
      client: {},
      bucket: 'default-bucket',
      endpoint: null,
      region: 'us-east-1',
    }))
  })

  it('uploadToS3 validates chat upload and returns a presigned post for normal courses', async () => {
    const res1 = createMockRes()
    await uploadToS3Handler(
      createMockReq({
        method: 'POST',
        body: {
          uniqueFileName: 'file.txt',
          courseName: 'CS101',
          uploadType: 'chat',
        },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(400)

    hoisted.createPresignedPost.mockResolvedValueOnce({
      url: 'u',
      fields: { key: 'k' },
    })
    const res2 = createMockRes()
    await uploadToS3Handler(
      createMockReq({
        method: 'POST',
        body: {
          uniqueFileName: 'file.txt',
          courseName: 'CS101',
        },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({
      message: 'Presigned URL generated successfully',
      post: { url: 'u', fields: { key: 'k' } },
    })
  })

  it('getPresignedUrl returns 405 for non-GET and 200 for normal courses', async () => {
    const res1 = createMockRes()
    await getPresignedUrlHandler(
      createMockReq({ method: 'POST' }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(405)

    hoisted.getSignedUrl.mockResolvedValueOnce('https://signed.example')
    const res2 = createMockRes()
    await getPresignedUrlHandler(
      createMockReq({
        method: 'GET',
        query: { s3_path: 'courses/CS101/file.txt', course_name: 'CS101' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(res2.json).toHaveBeenCalledWith({
      presignedUrl: 'https://signed.example',
    })
  })

  it('getPresignedUrl returns 500 when ConnectionManager throws', async () => {
    cmHoisted.getS3Client.mockRejectedValueOnce(
      new Error('S3 client not configured'),
    )
    const res = createMockRes()
    await getPresignedUrlHandler(
      createMockReq({
        method: 'GET',
        query: { s3_path: 'users/u/file.txt', course_name: 'vyriad' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
