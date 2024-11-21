// upload.ts
import { S3Client } from '@aws-sdk/client-s3'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

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
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    const post = await createPresignedPost(s3Client, {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3_filepath,
      Expires: 60 * 60, // 1 hour
    })

    res
      .status(200)
      .json({ message: 'Presigned URL generated successfully', post })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler
