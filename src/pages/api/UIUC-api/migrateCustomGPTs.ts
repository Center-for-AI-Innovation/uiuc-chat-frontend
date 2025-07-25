import type { NextApiRequest, NextApiResponse } from 'next'
import { type CourseMetadata, type CustomSystemPrompt } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get all course metadata
    const allCourseMetadataRaw = await redisClient.hGetAll('course_metadatas')
    if (!allCourseMetadataRaw) {
      return res.status(200).json({ 
        message: 'No course metadata found to migrate',
        migratedCount: 0 
      })
    }

    let migratedCount = 0
    const migrationResults: { courseName: string; gptCount: number; errors: string[] }[] = []

    for (const [courseName, metadataString] of Object.entries(allCourseMetadataRaw)) {
      try {
        const courseMetadata: CourseMetadata = JSON.parse(metadataString)
        
        if (courseMetadata.custom_system_prompts && courseMetadata.custom_system_prompts.length > 0) {
          const gptIds: string[] = []
          const errors: string[] = []

          // Move each custom GPT to the separate hash
          for (const customGPT of courseMetadata.custom_system_prompts) {
            try {
              // Add project name to the custom GPT
              const gptWithProject: CustomSystemPrompt = {
                ...customGPT,
                project_name: courseName
              }

              // Use gpt_id as the key if available, otherwise use id
              const gptKey = gptWithProject.gpt_id || gptWithProject.id
              gptIds.push(gptKey)

              // Save to the separate hash
              await redisClient.hSet('custom_gpts', {
                [gptKey]: JSON.stringify(gptWithProject)
              })

              migratedCount++
            } catch (gptError) {
              const errorMsg = `Failed to migrate GPT ${customGPT.id}: ${gptError}`
              console.error(errorMsg)
              errors.push(errorMsg)
            }
          }

          // Update course metadata to use gpt_ids instead of custom_system_prompts
          const updatedMetadata: CourseMetadata = {
            ...courseMetadata,
            custom_gpt_ids: gptIds,
            custom_system_prompts: undefined // Remove the old field
          }

          // Save updated course metadata
          await redisClient.hSet('course_metadatas', {
            [courseName]: JSON.stringify(updatedMetadata)
          })

          migrationResults.push({
            courseName,
            gptCount: gptIds.length,
            errors
          })
        }
      } catch (parseError) {
        console.error(`Failed to parse metadata for course ${courseName}:`, parseError)
        migrationResults.push({
          courseName,
          gptCount: 0,
          errors: [`Parse error: ${parseError}`]
        })
      }
    }

    return res.status(200).json({
      message: 'Migration completed',
      migratedCount,
      results: migrationResults
    })

  } catch (error) {
    console.error('Error in migrateCustomGPTs handler:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 