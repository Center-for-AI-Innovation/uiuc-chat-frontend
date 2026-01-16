import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const startTime = Date.now()
  try {
    // const redisStartTime = Date.now()
    const redisClient = await ensureRedisConnected()
    const maintenanceStatus = await redisClient.get('maintenance-mode')

    // console.log(`[getMaintenanceMode] Redis query took ${Date.now() - redisStartTime}ms`)

    res.status(200).json({
      isMaintenanceMode: maintenanceStatus === 'true',
    })
  } catch (error) {
    console.error(
      '[getMaintenanceMode] Failed to check maintenance mode:',
      error,
    )
    res.status(500).json({ error: 'Failed to check maintenance mode' })
    console.log(
      `[getMaintenanceMode] Failed request took ${Date.now() - startTime}ms`,
    )
  }
}

export default handler
