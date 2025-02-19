import { S3Client } from '@aws-sdk/client-s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
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
if (process.env.MINIO_KEY && process.env.MINIO_SECRET && process.env.MINIO_ENDPOINT) {
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
    if (courseName === "vyriad") {
      if (!vyriadMinioClient) {
        throw new Error('MinIO client not configured - missing required environment variables')
      }

      const command = new GetObjectCommand({
        Bucket: 'pubmed', // Custom for Vyriad
        Key: filePath,
        ResponseContentDisposition: 'inline',
        ResponseContentType: ResponseContentType,
      })

      presignedUrl = await getSignedUrl(vyriadMinioClient, command, {
        expiresIn: 3600,
      })
    } else {
      if (!s3Client) {
        throw new Error('S3 client not configured - missing required environment variables')
      }

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
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
    const e = error as { name: string }
    if (e.name === 'NoSuchKey') {
      console.error('File does not exist:', error)
      res.status(404).json({ message: 'File does not exist' })
    } else {
      console.error('Error generating presigned URL:', error)
      res.status(500).json({ message: 'Error generating presigned URL', error })
    }
  }
}

export default handler
