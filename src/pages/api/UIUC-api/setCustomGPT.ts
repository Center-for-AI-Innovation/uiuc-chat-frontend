import type { NextApiRequest, NextApiResponse } from 'next'
import { type CustomSystemPrompt } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'
import { getCourseMetadata } from './getCourseMetadata'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { customGPT, projectName } = req.body as {
      customGPT: CustomSystemPrompt
      projectName: string
    }

    if (!customGPT || !projectName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: customGPT and projectName' 
      })
    }

    // Ensure the custom GPT has the project name
    const gptWithProject = {
      ...customGPT,
      project_name: projectName
    }

    // Use gpt_id as the key if available, otherwise use id
    const gptKey = gptWithProject.gpt_id || gptWithProject.id

    // Save the custom GPT to the separate hash
    await redisClient.hSet('custom_gpts', {
      [gptKey]: JSON.stringify(gptWithProject)
    })

    // Update the course metadata to include this GPT ID
    const courseMetadata = await getCourseMetadata(projectName)
    if (courseMetadata) {
      const existingGptIds = courseMetadata.custom_gpt_ids || []
      if (!existingGptIds.includes(gptKey)) {
        const updatedGptIds = [...existingGptIds, gptKey]
        const updatedMetadata = {
          ...courseMetadata,
          custom_gpt_ids: updatedGptIds
        }

        await redisClient.hSet('course_metadatas', {
          [projectName]: JSON.stringify(updatedMetadata)
        })
      }
    }

    return res.status(200).json({ success: true, gptId: gptKey })
  } catch (error) {
    console.error('Error in setCustomGPT handler:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 