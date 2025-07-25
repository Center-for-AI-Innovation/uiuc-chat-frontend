import type { NextApiRequest, NextApiResponse } from 'next'
import { type CustomSystemPrompt, type CustomGPTsHash } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export const getCustomGPTs = async (
  gptIds: string[],
): Promise<CustomSystemPrompt[]> => {
  try {
    if (!gptIds || gptIds.length === 0) {
      return []
    }

    const customGPTsHash = await redisClient.hGetAll('custom_gpts')
    if (!customGPTsHash) {
      return []
    }

    const customGPTs: CustomSystemPrompt[] = []
    for (const gptId of gptIds) {
      const gptData = customGPTsHash[gptId]
      if (gptData) {
        try {
          const customGPT = JSON.parse(gptData) as CustomSystemPrompt
          customGPTs.push(customGPT)
        } catch (parseError) {
          console.error('Error parsing custom GPT data:', parseError, gptData)
        }
      }
    }

    return customGPTs
  } catch (error) {
    console.error('Error occurred while fetching custom GPTs', error)
    return []
  }
}

export const getAllCustomGPTs = async (): Promise<CustomGPTsHash> => {
  try {
    const customGPTsHash = await redisClient.hGetAll('custom_gpts')
    if (!customGPTsHash) {
      return {}
    }

    const parsedCustomGPTs: CustomGPTsHash = {}
    for (const [gptId, gptData] of Object.entries(customGPTsHash)) {
      try {
        parsedCustomGPTs[gptId] = JSON.parse(gptData) as CustomSystemPrompt
      } catch (parseError) {
        console.error('Error parsing custom GPT data:', parseError, gptData)
      }
    }

    return parsedCustomGPTs
  } catch (error) {
    console.error('Error occurred while fetching all custom GPTs', error)
    return {}
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { gptIds, projectName } = req.query

    try {
      if (gptIds) {
        // Get specific GPTs by IDs
        const gptIdsArray = Array.isArray(gptIds) ? gptIds : [gptIds]
        const customGPTs = await getCustomGPTs(gptIdsArray)
        return res.status(200).json({ custom_gpts: customGPTs })
      } else if (projectName) {
        // Get all GPTs for a specific project
        const allCustomGPTs = await getAllCustomGPTs()
        const projectGPTs = Object.values(allCustomGPTs).filter(
          (gpt) => gpt.project_name === projectName
        )
        return res.status(200).json({ custom_gpts: projectGPTs })
      } else {
        // Get all GPTs
        const allCustomGPTs = await getAllCustomGPTs()
        return res.status(200).json({ custom_gpts: Object.values(allCustomGPTs) })
      }
    } catch (error) {
      console.error('Error in getCustomGPTs handler:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
} 