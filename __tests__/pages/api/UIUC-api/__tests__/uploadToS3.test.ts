import { describe, expect, it, vi } from 'vitest'
import { createMockReq, createMockRes } from '~/test-utils/nextApi'

const hoisted = vi.hoisted(() => {
  return {
    createPresignedPost: vi.fn(async () => ({ url: 'u', fields: {} })),
  }
})

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: hoisted.createPresignedPost,
}))

vi.mock('~/utils/s3Client', () => ({
  s3Client: {},
  vyriadMinioClient: {},
}))

vi.mock('~/pages/api/authorization', () => ({
  withCourseAccessFromRequest: () => (h: any) => h,
}))

import handler from '~/pages/api/UIUC-api/uploadToS3'

describe('UIUC-api/uploadToS3', () => {
  it('requires user_id for chat uploads', async () => {
    const res = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { uniqueFileName: 'f', courseName: 'CS101', uploadType: 'chat' },
      }) as any,
      res as any,
    )
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('generates presigned posts for normal and vyriad courses', async () => {
    process.env.S3_BUCKET_NAME = 'b'
    const res1 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { uniqueFileName: 'f', courseName: 'CS101' },
      }) as any,
      res1 as any,
    )
    expect(res1.status).toHaveBeenCalledWith(200)

    const res2 = createMockRes()
    await handler(
      createMockReq({
        method: 'POST',
        body: { uniqueFileName: 'f', courseName: 'vyriad', user_id: 'u', uploadType: 'chat' },
      }) as any,
      res2 as any,
    )
    expect(res2.status).toHaveBeenCalledWith(200)
    expect(hoisted.createPresignedPost).toHaveBeenCalled()
  })
})

