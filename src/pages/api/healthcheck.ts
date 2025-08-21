import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { db, keycloakDB } from '~/db/dbClient'
import { s3Client } from '~/utils/s3Client'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, { status: string; error?: string }> = {
    app: { status: 'ok' }, // Always alive if route responds
  }

  // Redis
  try {
    await redisClient.ping()
    checks.redis = { status: 'ok' }
  } catch (err: any) {
    checks.redis = { status: 'error', error: err.message }
  }

  // S3
  if (s3Client && process.env.S3_BUCKET) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }))
      checks.s3 = { status: 'ok' }
    } catch (err: any) {
      checks.s3 = { status: 'error', error: err.message }
    }
  } else {
    checks.s3 = { status: 'skipped', error: 'No S3 config' }
  }

  // Postgres main DB
  try {
    await db.execute('SELECT 1')
    checks.postgres = { status: 'ok' }
  } catch (err: any) {
    checks.postgres = { status: 'error', error: err.message }
  }

  // Postgres Keycloak DB
  try {
    await keycloakDB.execute('SELECT 1')
    checks.keycloak = { status: 'ok' }
  } catch (err: any) {
    checks.keycloak = { status: 'error', error: err.message }
  }

  const isHealthy = Object.values(checks).every(c => c.status === 'ok' || c.status === 'skipped')
  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'UP' : 'DOWN',   // overall status
    healthy: isHealthy,                  // boolean summary
    checks,                              // detailed per-service results
    timestamp: new Date().toISOString(), // optional: useful for logs/monitoring
  })
}
