// pages/api/getPresignedUrl.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { s3_path, course_name } = req.query

    console.log('In the presigned URL block')
    try {
      let presignedUrl
      if (course_name === 'vyriad' || course_name === 'pubmed') {
        console.log('In the vyriad if statement')
        if (!vyriadMinioClient) {
          throw new Error(
            'MinIO client not configured - missing required environment variables',
          )
        }
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: s3_path as string,
        })
        presignedUrl = await getSignedUrl(vyriadMinioClient, command, {
          expiresIn: 3600,
        })
      } else {
        const s3Client = getS3Client(course_name as string)
        const bucketName = getS3BucketName(course_name as string)

        if (!s3Client) {
          throw new Error(
            'S3 client not configured - missing required environment variables',
          )
        }
        const command = new GetObjectCommand({
          Bucket: bucketName!,
          Key: s3_path as string,
        })
        presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        })
      }
      res.status(200).json({ presignedUrl })
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      res.status(500).json({ error: 'Error generating presigned URL' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
