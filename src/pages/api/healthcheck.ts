import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from 'redis'
// import { HeadBucketCommand } from '@aws-sdk/client-s3'
// import { db, keycloakDB } from '~/db/dbClient'
// import { s3Client } from '~/utils/s3Client'
// import { qdrant } from '~/utils/qdrantClient'

function serializeError(err: any) {
  try {
    return JSON.stringify(
      {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        code: err?.code,
        ...err,
      },
      null,
      2,
    )
  } catch (e) {
    return String(err)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, { status: string; error?: string }> = {
    app: { status: 'ok' },
  }

  // Redis
  if (process.env.REDIS_URL) {
    try {
      const redis = createClient({
        url: process.env.REDIS_URL!,
        socket: { reconnectStrategy: false },
      })
      await redis.connect()
      await redis.ping()
      checks.redis = { status: 'ok' }
      await redis.disconnect()
    } catch (err: any) {
      checks.redis = { status: 'error', error: serializeError(err) }
    }
  } else {
    checks.redis = { status: 'skipped', error: 'No Redis config' }
  }

  // S3
  // if (s3Client && process.env.S3_BUCKET_NAME) {
  //   try {
  //     await s3Client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_NAME }))
  //     checks.s3 = { status: 'ok' }
  //   } catch (err: any) {
  //     checks.s3 = { status: 'error', error: serializeError(err) }
  //   }
  // } else {
  //   checks.s3 = { status: 'skipped', error: 'No S3 config' }
  // }

  // Postgres main DB
  // try {
  //   await db.execute('SELECT 1')
  //   checks.postgres = { status: 'ok' }
  // } catch (err: any) {
  //   checks.postgres = { status: 'error', error: serializeError(err) }
  // }

  // Postgres Keycloak DB
  // try {
  //   await keycloakDB.execute('SELECT 1')
  //   checks.keycloak = { status: 'ok' }
  // } catch (err: any) {
  //   checks.keycloakDB = { status: 'error', error: serializeError(err) }
  // }

  // Qdrant
  // if (process.env.QDRANT_URL && process.env.QDRANT_API_KEY) {
  //   try {
  //     await qdrant.getCollections()
  //     checks.qdrant = { status: 'ok' }
  //   } catch (err: any) {
  //     checks.qdrant = { status: 'error', error: serializeError(err) }
  //   }
  // } else {
  //   checks.qdrant = { status: 'skipped', error: 'No Qdrant config' }
  // }

  const isHealthy = Object.values(checks).every(
    (c) => c.status === 'ok' || c.status === 'skipped',
  )
  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'UP' : 'DOWN',
    healthy: isHealthy,
    checks,
    timestamp: new Date().toISOString(),
  })
}
