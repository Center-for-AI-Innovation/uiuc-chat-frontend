import { type NextApiRequest, type NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const startTime = Date.now()
    try {
        // const redisStartTime = Date.now()
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
        console.error('[getMaintenanceMode] Failed to check maintenance mode:', error)
        res.status(500).json({ error: 'Failed to check maintenance mode' })
        console.log(`[getMaintenanceMode] Failed request took ${Date.now() - startTime}ms`)
    }
}