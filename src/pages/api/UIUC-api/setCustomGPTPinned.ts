import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { gptId, projectName, isPinned } = req.body as {
    gptId: string
    projectName: string
    isPinned: boolean
  }

  if (!gptId || !projectName || typeof isPinned !== 'boolean') {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required parameters: gptId, projectName, and isPinned' 
    })
  }

  try {
    // Get the existing custom GPT data
    const existingGptData = await redisClient.hGet('custom_gpts', gptId)
    if (!existingGptData) {
      return res.status(404).json({ 
        success: false,
        error: 'Custom GPT not found' 
      })
    }

    const existingGpt = JSON.parse(existingGptData)
    
    // Update only the isPinned field
    const updatedGpt = {
      ...existingGpt,
      isPinned,
    }

    // Save the updated custom GPT
    await redisClient.hSet('custom_gpts', {
      [gptId]: JSON.stringify(updatedGpt)
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in setCustomGPTPinned handler:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 