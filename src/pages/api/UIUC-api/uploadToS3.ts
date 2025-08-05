// upload.ts
import { S3Client } from '@aws-sdk/client-s3'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, user_id, courseName } = req.body as {
      uniqueFileName: string
      user_id: string
      courseName: string
    }

    const s3_filepath = `${user_id}/${uniqueFileName}`
    let post
    if (courseName === 'vyriad') {
      if (!vyriadMinioClient) {
        throw new Error(
          'MinIO client not configured - missing required environment variables',
        )
      }
      post = await createPresignedPost(vyriadMinioClient, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })
    } else {
      if (!s3Client) {
        throw new Error(
          'S3 client not configured - missing required environment variables',
        )
      }
      post = await createPresignedPost(s3Client, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })
    }

    res
      .status(200)
      .json({ message: 'Presigned URL generated successfully', post })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler
