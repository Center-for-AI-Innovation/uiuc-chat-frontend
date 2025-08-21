import { S3Client } from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION


// S3 Client configuration
let s3Client: S3Client | null = null
if (region && process.env.AWS_KEY && process.env.AWS_SECRET) {
  s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    },
    // endpoint: process.env.MINIO_ENDPOINT,
    //forcePathStyle: true, // Required for MinIO
  })
} else if (region) {
  s3Client = new S3Client({
    region: region,
  })
}


// MinIO Client configuration
let vyriadMinioClient: S3Client | null = null
if (
  process.env.MINIO_KEY &&
  process.env.MINIO_SECRET &&
  process.env.MINIO_ENDPOINT
) {
  vyriadMinioClient = new S3Client({
    region: process.env.MINIO_REGION || 'us-east-1', // MinIO requires a region, but it can be arbitrary
    credentials: {
      accessKeyId: process.env.MINIO_KEY,
      secretAccessKey: process.env.MINIO_SECRET,
    },
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  })
}

export { s3Client, vyriadMinioClient }
