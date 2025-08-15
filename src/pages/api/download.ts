import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getS3Client, getS3BucketName } from '~/utils/s3Client'

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
    const { filePath, courseName } = req.body as {
      filePath: string
      courseName: string
    }

    let ResponseContentType = undefined

    if (filePath.endsWith('.pdf')) {
      ResponseContentType = 'application/pdf'
    }

    if (filePath.endsWith('.png')) {
      ResponseContentType = 'application/png'
    }

    let presignedUrl
    if (courseName === 'vyriad' || courseName === 'pubmed') {
      if (!vyriadMinioClient) {
        throw new Error(
          'MinIO client not configured - missing required environment variables',
        )
      }

      // Extract bucket name from the first part of the path
      const pathParts = filePath.split('/')
      const bucketName = pathParts[0]
      const actualKey = pathParts.slice(1).join('/')

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: actualKey,
        ResponseContentDisposition: 'inline',
        ResponseContentType: ResponseContentType,
      })

      presignedUrl = await getSignedUrl(vyriadMinioClient, command, {
        expiresIn: 3600,
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
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: filePath,
        ResponseContentDisposition: 'inline',
        ResponseContentType: ResponseContentType,
      })

      presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      })
    }

    res.status(200).json({
      message: 'Presigned URL generated successfully',
      url: presignedUrl,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export default handler
