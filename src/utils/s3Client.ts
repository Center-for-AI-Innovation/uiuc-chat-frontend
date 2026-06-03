import { S3Client } from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION

// Default S3 client used when a project has no per-project s3_config override.
// Per-project clients are built dynamically by ConnectionManager.
let s3Client: S3Client | null = null
if (region && process.env.AWS_KEY && process.env.AWS_SECRET) {
  const baseConfig: any = {
    region,
    credentials: {
      accessKeyId: process.env.AWS_KEY!,
      secretAccessKey: process.env.AWS_SECRET!,
    },
  }

  if (process.env.LOCAL_MINIO === 'true' && process.env.MINIO_ENDPOINT) {
    baseConfig.endpoint = process.env.MINIO_ENDPOINT
    baseConfig.forcePathStyle = true // required for MinIO / LocalStack
  }

  s3Client = new S3Client(baseConfig)
} else if (region) {
  s3Client = new S3Client({ region })
}

export { s3Client }
