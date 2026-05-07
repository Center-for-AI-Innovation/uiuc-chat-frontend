import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { connectionManager } from '~/utils/connectionManager'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

export async function generatePresignedUrl(
  filePath: string,
  courseName: string,
  fileName?: string,
): Promise<string> {
  let ResponseContentType: string | undefined = undefined

  if (filePath.endsWith('.pdf')) {
    ResponseContentType = 'application/pdf'
  } else if (filePath.endsWith('.png')) {
    ResponseContentType = 'application/png'
  }

  const { client, bucket } = await connectionManager.getS3Client(courseName)
  if (!bucket) {
    throw new Error(
      `S3 bucket not configured for project '${courseName}' (no s3_config.bucket_name and S3_BUCKET_NAME unset)`,
    )
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: filePath,
    ResponseContentDisposition: fileName
      ? `attachment; filename="${fileName}"`
      : 'inline',
    ResponseContentType,
  })

  return await getSignedUrl(client, command, { expiresIn: 3600 })
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { filePath, courseName, fileName } = req.body as {
      filePath: string
      courseName: string
      fileName?: string
    }

    const presignedUrl = await generatePresignedUrl(
      filePath,
      courseName,
      fileName,
    )

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

export default withCourseAccessFromRequest('any')(handler)
