import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { s3Client, vyriadMinioClient } from '~/utils/s3Client'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

/**
 * Generate a presigned URL for downloading a file from S3/MinIO.
 * This is the core logic - exported for reuse in server-side code.
 * @param filePath - The S3/MinIO path of the file
 * @param courseName - The course name (determines S3 vs MinIO)
 * @param fileName - Optional filename for Content-Disposition header
 * @returns The presigned URL
 * @throws Error if S3/MinIO client is not configured or file doesn't exist
 */
export async function generatePresignedUrl(
  filePath: string,
  courseName: string,
  fileName?: string,
): Promise<string> {
  let ResponseContentType: string | undefined = undefined

  if (filePath.endsWith('.pdf')) {
    ResponseContentType = 'application/pdf'
  } else if (filePath.endsWith('.png')) {
    ResponseContentType = 'image/png'
  }

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
      ResponseContentType,
    })

    return await getSignedUrl(vyriadMinioClient, command, {
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
      ResponseContentType,
    })

    return await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    })
  }
}

export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { filePath, courseName, fileName } = req.body as {
      filePath: string
      courseName: string
      fileName?: string
    }

    const presignedUrl = await generatePresignedUrl(filePath, courseName, fileName)

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
