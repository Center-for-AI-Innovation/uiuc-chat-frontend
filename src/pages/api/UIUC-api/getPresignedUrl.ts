// pages/api/getPresignedUrl.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getPresignedUrlClient, getPresignedUrlVyriadClient } from '~/utils/s3Client'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
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
        const presignedClient = getPresignedUrlVyriadClient()
        if (!presignedClient) {
          throw new Error(
            'MinIO client not configured - missing required environment variables',
          )
        }
        presignedUrl = await getSignedUrl(presignedClient, command, {
          expiresIn: 3600,
        })
      } else {
        const presignedClient = getPresignedUrlClient()
        if (!presignedClient) {
          throw new Error(
            'S3 client not configured - missing required environment variables',
          )
        }
        presignedUrl = await getSignedUrl(presignedClient, command, {
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

export default withCourseAccessFromRequest('any')(handler)
