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
        success: false,
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

    // Get existing custom GPT data if it exists
    const existingGptData = await redisClient.hGet('custom_gpts', gptKey)
    let existingGpt: CustomSystemPrompt | null = null
    
    if (existingGptData) {
      try {
        existingGpt = JSON.parse(existingGptData) as CustomSystemPrompt
      } catch (parseError) {
        console.error('Error parsing existing custom GPT data:', parseError)
      }
    }

    // Combine existing data with new data, prioritizing new values
    const combinedGpt = { ...existingGpt, ...gptWithProject }

    console.log('-----------------------------------------')
    console.log('EXISTING custom GPT:', existingGpt)
    console.log('passed into upsert custom GPT:', gptWithProject)
    console.log('FINAL COMBINED custom GPT:', combinedGpt)
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Save the combined custom GPT to the separate hash
    await redisClient.hSet('custom_gpts', {
      [gptKey]: JSON.stringify(combinedGpt)
    })

    // Update the course metadata to include this GPT ID if it's not already there
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
    console.error('Error in upsertCustomGPT handler:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 