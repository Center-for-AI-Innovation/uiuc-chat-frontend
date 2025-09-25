import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest, withAuth } from '~/utils/authMiddleware'
import { s3Client, vyriadMinioClient } from '~/utils/s3Client'
// import { withCourseAccessFromRequest } from '~/pages/api/authorization'

export default withAuth(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { filePath, courseName, fileName } = req.body as {
      filePath: string
      courseName: string
      fileName?: string
    }

    let ResponseContentType = undefined

    if (filePath.endsWith('.pdf')) {
      ResponseContentType = 'application/pdf'
    }

    if (filePath.endsWith('.png')) {
      ResponseContentType = 'application/png'
    }

    let presignedUrl
    if (courseName === 'vyriad' || courseName === 'pubmed') {
      if (!vyriadMinioClient) {
        throw new Error(
          'MinIO client not configured - missing required environment variables',
        )
      }

      // Extract bucket name from the first part of the path
      const pathParts = filePath.split('/')
      const bucketName = pathParts[0]
      const actualKey = pathParts.slice(1).join('/')

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: actualKey,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${fileName}"`
          : 'inline',
        ResponseContentType: ResponseContentType,
      })

      presignedUrl = await getSignedUrl(vyriadMinioClient, command, {
        expiresIn: 3600,
      })
    } else {
      if (!s3Client) {
        throw new Error(
          'S3 client not configured - missing required environment variables',
        )
      }

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: filePath,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${fileName}"`
          : 'inline',
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
