/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest'

describe('s3Client', () => {
  it('creates an S3Client with explicit credentials when AWS_KEY/AWS_SECRET are set', async () => {
    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    vi.stubEnv('AWS_REGION', 'us-east-1')
    vi.stubEnv('AWS_KEY', 'k')
    vi.stubEnv('AWS_SECRET', 's')
    vi.stubEnv('LOCAL_MINIO', '')
    vi.stubEnv('MINIO_ENDPOINT', '')

    vi.resetModules()
    const mod = await import('../s3Client')
    expect(mod.s3Client).toBeTruthy()
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'us-east-1',
        credentials: { accessKeyId: 'k', secretAccessKey: 's' },
      }),
    )
  })

  it('adds MinIO endpoint + forcePathStyle when LOCAL_MINIO=true', async () => {
    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    vi.stubEnv('AWS_REGION', 'us-east-1')
    vi.stubEnv('AWS_KEY', 'k')
    vi.stubEnv('AWS_SECRET', 's')
    vi.stubEnv('LOCAL_MINIO', 'true')
    vi.stubEnv('MINIO_ENDPOINT', 'http://minio:9000')

    vi.resetModules()
    await import('../s3Client')
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'http://minio:9000',
        forcePathStyle: true,
      }),
    )
  })

  it('creates a region-only S3Client when credentials are missing', async () => {
    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    vi.stubEnv('AWS_REGION', 'us-east-1')
    vi.stubEnv('AWS_KEY', '')
    vi.stubEnv('AWS_SECRET', '')

    vi.resetModules()
    await import('../s3Client')
    expect(ctor).toHaveBeenCalledWith({ region: 'us-east-1' })
  })

  it('creates a MinIO client when MINIO env vars are present', async () => {
    const ctor = vi.fn()
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: ctor }))

    vi.stubEnv('AWS_REGION', '')
    vi.stubEnv('MINIO_KEY', 'mk')
    vi.stubEnv('MINIO_SECRET', 'ms')
    vi.stubEnv('MINIO_ENDPOINT', 'http://minio:9000')
    vi.stubEnv('MINIO_REGION', '')

    vi.resetModules()
    const mod = await import('../s3Client')
    expect(mod.vyriadMinioClient).toBeTruthy()
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'us-east-1',
        endpoint: 'http://minio:9000',
        forcePathStyle: true,
      }),
    )
  })
})

