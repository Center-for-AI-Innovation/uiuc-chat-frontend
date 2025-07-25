import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'
import { getCourseMetadata } from './getCourseMetadata'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { gptId, projectName } = req.query as {
      gptId: string
      projectName: string
    }

    if (!gptId || !projectName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: gptId and projectName' 
      })
    }

    // Delete the custom GPT from the separate hash
    await redisClient.hDel('custom_gpts', gptId)

    // Update the course metadata to remove this GPT ID
    const courseMetadata = await getCourseMetadata(projectName)
    if (courseMetadata) {
      const existingGptIds = courseMetadata.custom_gpt_ids || []
      const updatedGptIds = existingGptIds.filter(id => id !== gptId)
      
      const updatedMetadata = {
        ...courseMetadata,
        custom_gpt_ids: updatedGptIds
      }

      await redisClient.hSet('course_metadatas', {
        [projectName]: JSON.stringify(updatedMetadata)
      })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in deleteCustomGPT handler:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 