// pages/api/getPresignedUrl.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextApiRequest, NextApiResponse } from 'next'

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
  process.env.VYRIAD_KEY &&
  process.env.VYRIAD_SECRET &&
  process.env.VYRIAD_ENDPOINT
) {
  vyriadMinioClient = new S3Client({
    region: process.env.VYRIAD_REGION || 'us-east-1', // MinIO requires a region, but it can be arbitrary
    credentials: {
      accessKeyId: process.env.VYRIAD_KEY,
      secretAccessKey: process.env.VYRIAD_SECRET,
    },
    endpoint: process.env.VYRIAD_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { s3_path, course_name } = req.query

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3_path as string,
    })

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
        presignedUrl = await getSignedUrl(vyriadMinioClient, command, {
          expiresIn: 3600,
        })
      } else {
        if (!s3Client) {
          throw new Error(
            'S3 client not configured - missing required environment variables',
          )
        }
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
