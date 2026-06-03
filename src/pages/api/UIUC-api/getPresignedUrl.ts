// pages/api/getPresignedUrl.ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { connectionManager } from '~/utils/connectionManager'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { s3_path, course_name } = req.query
  if (typeof s3_path !== 'string' || typeof course_name !== 'string') {
    return res
      .status(400)
      .json({ error: 'Missing or invalid s3_path / course_name query params' })
  }

  try {
    const { client, bucket } = await connectionManager.getS3Client(course_name)
    if (!bucket) {
      throw new Error(
        `S3 bucket not configured for project '${course_name}' (no s3_config.bucket_name and S3_BUCKET_NAME unset)`,
      )
    }
    const command = new GetObjectCommand({ Bucket: bucket, Key: s3_path })
    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
    })
    res.status(200).json({ presignedUrl })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ error: 'Error generating presigned URL' })
  }
}

export default withCourseAccessFromRequest('any')(handler)
