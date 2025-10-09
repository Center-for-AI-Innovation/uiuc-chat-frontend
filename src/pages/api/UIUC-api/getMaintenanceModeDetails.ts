import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { ensureRedisConnected } from '~/utils/redisClient'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const startTime = Date.now()
  try {
    // const redisStartTime = Date.now()
    const redisClient = await ensureRedisConnected()
    const [titleText, bodyText] = await Promise.all([
      // redisClient.get('maintenance-mode'),
      redisClient.get('maintenance-title-text'),
      redisClient.get('maintenance-body-text'),
    ])
    // console.log(`[getMaintenanceModeDetails] Redis query took ${Date.now() - redisStartTime}ms`)

    res.status(200).json({
      // isMaintenanceMode: maintenanceStatus === 'true',
      maintenanceTitleText: titleText,
      maintenanceBodyText: bodyText,
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

export default withAuth(handler)
