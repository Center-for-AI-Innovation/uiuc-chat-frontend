// pages/api/getPresignedUrl.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextApiRequest, NextApiResponse } from 'next'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    // @ts-ignore -- it's fine, stop complaining
    accessKeyId: process.env.AWS_KEY,
    // @ts-ignore -- it's fine, stop complaining
    secretAccessKey: process.env.AWS_SECRET,
  },
  // If MINIO_ENDPOINT is defined, use it instead of AWS S3.
  ...(process.env.MINIO_ENDPOINT
    ? {
        endpoint: process.env.MINIO_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY,
          secretAccessKey: process.env.MINIO_SECRET,
        },
      }
    : {}),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { s3_path } = req.query

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3_path as string,
    })

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60,
      }) // 1 hour
      res.status(200).json({ presignedUrl })
    } catch (error) {
      res.status(500).json({ error: 'Error generating presigned URL' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
