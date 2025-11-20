import {S3Client} from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION


// S3 Client configuration
console.log('[s3Client] Debug - Environment variables:')
console.log('[s3Client] AWS_REGION:', process.env.AWS_REGION)
console.log('[s3Client] AWS_KEY:', process.env.AWS_KEY ? `***${process.env.AWS_KEY.slice(-4)}` : 'undefined')
console.log('[s3Client] AWS_SECRET:', process.env.AWS_SECRET ? '***' + '*'.repeat(Math.min(process.env.AWS_SECRET.length - 4, 8)) + process.env.AWS_SECRET.slice(-4) : 'undefined')
console.log('[s3Client] LOCAL_MINIO:', process.env.LOCAL_MINIO)
console.log('[s3Client] MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT)
console.log('[vyriadMinioClient] S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME)

let s3Client: S3Client | null = null
if (region && process.env.AWS_KEY && process.env.AWS_SECRET) {
    console.log('[s3Client] Using credentials-based configuration')
    const baseConfig: any = {
        region,
        credentials: {
            accessKeyId: process.env.AWS_KEY!,
            secretAccessKey: process.env.AWS_SECRET!,
        },
    }

    if (process.env.LOCAL_MINIO === 'true' && process.env.MINIO_ENDPOINT) {
        console.log('[s3Client] Configuring for MinIO/LocalStack')
        baseConfig.endpoint = process.env.MINIO_ENDPOINT
        baseConfig.forcePathStyle = true // required for MinIO / LocalStack
    }

    console.log('[s3Client] Final config:', {
        region: baseConfig.region,
        endpoint: baseConfig.endpoint,
        forcePathStyle: baseConfig.forcePathStyle,
        hasCredentials: !!baseConfig.credentials,
    })

    s3Client = new S3Client(baseConfig)
    console.log('[s3Client] S3Client initialized with credentials')
} else if (region) {
    console.log('[s3Client] Using region-only configuration (no credentials)')
    console.log('[s3Client] Final config:', {region})
    s3Client = new S3Client({region})
    console.log('[s3Client] S3Client initialized with region only')
} else {
    console.log('[s3Client] No S3Client initialized - missing region or credentials')
}

// MinIO Client configuration
console.log('[vyriadMinioClient] Debug - Environment variables:')
console.log('[vyriadMinioClient] MINIO_KEY:', process.env.MINIO_KEY ? `***${process.env.MINIO_KEY.slice(-4)}` : 'undefined')
console.log('[vyriadMinioClient] MINIO_SECRET:', process.env.MINIO_SECRET ? '***' + '*'.repeat(Math.min(process.env.MINIO_SECRET.length - 4, 8)) + process.env.MINIO_SECRET.slice(-4) : 'undefined')
console.log('[vyriadMinioClient] MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT)
console.log('[vyriadMinioClient] MINIO_REGION:', process.env.MINIO_REGION)
console.log('[vyriadMinioClient] S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME)

let vyriadMinioClient: S3Client | null = null
if (
    process.env.VYRIAD_MINIO_MINIO_KEY &&
    process.env.VYRIAD_MINIO_MINIO_SECRET &&
    process.env.VYRIAD_MINIO_MINIO_ENDPOINT
) {
    console.log('[vyriadMinioClient] Using MinIO configuration')
    const vyriadMinioConfig = {
        region: process.env.MINIO_REGION || 'us-east-1', // MinIO requires a region, but it can be arbitrary
        credentials: {
            accessKeyId: process.env.VYRIAD_MINIO_MINIO_KEY,
            secretAccessKey: process.env.VYRIAD_MINIO_MINIO_SECRET,
        },
        endpoint: process.env.VYRIAD_MINIO_MINIO_ENDPOINT,
        forcePathStyle: true, // Required for MinIO
    }

    console.log('[vyriadMinioClient] Final config:', {
        region: vyriadMinioConfig.region,
        endpoint: vyriadMinioConfig.endpoint,
        forcePathStyle: vyriadMinioConfig.forcePathStyle,
        hasCredentials: !!vyriadMinioConfig.credentials,
    })

    vyriadMinioClient = new S3Client(vyriadMinioConfig)
    console.log('[vyriadMinioClient] MinIO S3Client initialized')
} else {
    console.log('[vyriadMinioClient] No MinIO S3Client initialized - missing MINIO_KEY, MINIO_SECRET, or MINIO_ENDPOINT')
}

/**
 * Creates an S3Client configured for presigned URL generation.
 * Uses MINIO_PUBLIC_ENDPOINT (browser-accessible) instead of MINIO_ENDPOINT (Docker internal).
 * This is necessary because presigned URLs are used by the browser, which cannot resolve Docker service names.
 */
function getPresignedUrlClient(): S3Client | null {
    // Use public endpoint for presigned URLs (browser-accessible)
    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT

    const region = process.env.AWS_REGION || 'us-east-1'

    if (process.env.AWS_KEY && process.env.AWS_SECRET) {
        const baseConfig: any = {
            region,
            credentials: {
                accessKeyId: process.env.AWS_KEY!,
                secretAccessKey: process.env.AWS_SECRET!,
            },
        }
        if (process.env.LOCAL_MINIO === 'true' && process.env.MINIO_ENDPOINT) {
            baseConfig.endpoint = publicEndpoint
            baseConfig.forcePathStyle = true // required for MinIO / LocalStack
        }
        return new S3Client(baseConfig)
    } else {
        return new S3Client({region})
    }
}

/**
 * Creates a MinIO S3Client for the Vyriad project configured for presigned URL generation.
 * Uses MINIO_PUBLIC_ENDPOINT (browser-accessible) instead of MINIO_ENDPOINT (Docker internal).
 */
function getPresignedUrlVyriadClient(): S3Client | null {
    // Use public endpoint for presigned URLs (browser-accessible)
    const publicEndpoint = process.env.VYRIAD_MINIO_PUBLIC_ENDPOINT || process.env.VYRIAD_MINIO_ENDPOINT

    if (process.env.VYRIAD_MINIO_KEY && process.env.VYRIAD_MINIO_SECRET && publicEndpoint) {
        return new S3Client({
            region: process.env.VYRIAD_MINIO_REGION || 'us-east-1',
            endpoint: publicEndpoint,
            credentials: {
                accessKeyId: process.env.VYRIAD_MINIO_KEY,
                secretAccessKey: process.env.VYRIAD_MINIO_SECRET,
            },
            forcePathStyle: true,
        })
    }
    return vyriadMinioClient
}

export {s3Client, vyriadMinioClient, getPresignedUrlClient, getPresignedUrlVyriadClient}
