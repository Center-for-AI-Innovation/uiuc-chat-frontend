import { S3Client } from '@aws-sdk/client-s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextApiRequest, NextApiResponse } from 'next'

const region = process.env.MINIO_REGION || process.env.AWS_REGION
const accessKey = process.env.MINIO_ACCESS_KEY || process.env.AWS_KEY
const secretKey = process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET
const bucketName = process.env.MINIO_BUCKET_NAME || process.env.S3_BUCKET_NAME

if (!region || !accessKey || !secretKey || !bucketName) {
  throw new Error(
    'Missing required AWS credentials or bucket name in environment variables',
  )
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  ...(process.env.MINIO_ENDPOINT && {
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
  }),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { filePath } = req.body as {
      filePath: string
    }
    // only set ResponseContentType if it's PDF, cuz that's the only one we need to open a preview

    let ResponseContentType = undefined

    if (filePath.endsWith('.pdf')) {
      ResponseContentType = 'application/pdf'
    }

    if (filePath.endsWith('.png')) {
      ResponseContentType = 'application/png'
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      ResponseContentDisposition: 'inline',
      ResponseContentType: ResponseContentType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    })

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
