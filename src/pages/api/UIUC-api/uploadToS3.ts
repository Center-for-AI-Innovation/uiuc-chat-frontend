// upload.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getS3Client, getS3BucketName } from '~/utils/s3Client'
import { S3Client } from '@aws-sdk/client-s3'

// MinIO Client configuration (keeping existing MinIO support)
let vyriadMinioClient: any = null
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
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    let post
    if (courseName === 'vyriad') {
      if (!vyriadMinioClient) {
        throw new Error(
          'MinIO client not configured - missing required environment variables',
        )
      }
      const bucketName = process.env.S3_BUCKET_NAME
      if (!bucketName) {
        throw new Error('S3_BUCKET_NAME environment variable is not configured')
      }
      post = await createPresignedPost(vyriadMinioClient, {
        Bucket: bucketName,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })
    } else {
      const s3Client = getS3Client(courseName)
      const bucketName = getS3BucketName(courseName)

      if (!s3Client) {
        throw new Error(
          'S3 client not configured - missing required environment variables',
        )
      }
      if (!bucketName) {
        throw new Error('Bucket name is not configured for this course')
      }
      post = await createPresignedPost(s3Client, {
        Bucket: bucketName,
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
