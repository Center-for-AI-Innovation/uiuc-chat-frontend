// upload.ts
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { s3Client, vyriadMinioClient } from '~/utils/s3Client'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, user_id, courseName, uploadType } = req.body as {
      uniqueFileName: string
      user_id?: string
      courseName: string
      uploadType?: 'chat' | 'document-group'
    }

    // Validate required parameters based on upload type
    if (uploadType === 'chat' && !user_id) {
      return res.status(400).json({
        message: 'user_id is required for chat uploads',
        error: 'Missing required parameter: user_id for chat upload',
      })
    }

    // Use different path structures based on upload type
    const s3_filepath =
      uploadType === 'chat'
        ? `users/${user_id}/${uniqueFileName}`
        : `courses/${courseName}/${uniqueFileName}`
    let post
    if (courseName === 'vyriad') {
      if (!vyriadMinioClient) {
        throw new Error(
          'MinIO client not configured - missing required environment variables',
        )
      }
      post = await createPresignedPost(vyriadMinioClient, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })
    } else {
      if (!s3Client) {
        throw new Error(
          'S3 client not configured - missing required environment variables',
        )
      }
      post = await createPresignedPost(s3Client, {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3_filepath,
        Expires: 60 * 60, // 1 hour
      })
    }

    res
      .status(200)
      .json({ message: 'Presigned URL generated successfully', post })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
