// upload.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getS3Client, getS3BucketName } from '~/utils/s3Client'

// MinIO Client configuration (keeping existing MinIO support)
let vyriadMinioClient: any = null
if (
  process.env.MINIO_KEY &&
  process.env.MINIO_SECRET &&
  process.env.MINIO_ENDPOINT
) {
  const { S3Client } = require('@aws-sdk/client-s3')
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
      post = await createPresignedPost(vyriadMinioClient, {
        Bucket: process.env.S3_BUCKET_NAME!,
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
      post = await createPresignedPost(s3Client, {
        Bucket: bucketName!,
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
