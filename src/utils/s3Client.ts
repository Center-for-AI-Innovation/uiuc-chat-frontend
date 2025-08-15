import { S3Client } from '@aws-sdk/client-s3'

// Default S3 Client configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  },
})

// CropWizard-specific S3 Client configuration
export const cropwizardS3Client = new S3Client({
  region: process.env.CROPWIZARD_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CROPWIZARD_AWS_KEY!,
    secretAccessKey: process.env.CROPWIZARD_AWS_SECRET!,
  },
})

/**
 * Get the appropriate S3 client based on course name
 * @param courseName - The course name to check
 * @returns The appropriate S3 client
 * 
 * @example
 * // For regular courses
 * const client = getS3Client('cs101')
 * 
 * // For CropWizard courses
 * const client = getS3Client('cropwizard-corn-2024')
 */
export function getS3Client(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    console.log(`Using CropWizard S3 client for course: ${courseName}`)
    return cropwizardS3Client
  }
  return s3Client
}

/**
 * Get the appropriate S3 bucket name based on course name
 * @param courseName - The course name to check
 * @returns The appropriate bucket name
 */
export function getS3BucketName(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return process.env.CROPWIZARD_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME
  }
  return process.env.S3_BUCKET_NAME
}

/**
 * Get the appropriate AWS region based on course name
 * @param courseName - The course name to check
 * @returns The appropriate AWS region
 */
export function getAWSRegion(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return process.env.CROPWIZARD_AWS_REGION || process.env.AWS_REGION
  }
  return process.env.AWS_REGION
}

