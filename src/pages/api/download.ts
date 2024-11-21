import { S3Client } from '@aws-sdk/client-s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextApiRequest, NextApiResponse } from 'next'

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
          accessKeyId: process.env.AWS_KEY,
          secretAccessKey: process.env.AWS_SECRET,
        },
      }
    : {}),
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
      Bucket: process.env.S3_BUCKET_NAME!,
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
