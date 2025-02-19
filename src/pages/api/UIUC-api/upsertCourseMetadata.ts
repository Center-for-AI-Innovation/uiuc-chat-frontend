// upsertCourseMetadata.ts
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
import type { NextApiRequest, NextApiResponse } from 'next'
import { encrypt, isEncrypted } from '~/utils/crypto'
import { getCourseMetadata } from './getCourseMetadata'
import { redisClient } from '~/utils/redisClient'
import { superAdmins } from '~/utils/superAdmins'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { courseName, courseMetadata } = req.body as {
    courseName: string
    courseMetadata: CourseMetadataOptionalForUpsert
  }

  // Check if courseName is not null or undefined
  if (!courseName) {
    console.error('Error: courseName is null or undefined')
    return res.status(400).json({ success: false, error: 'Missing courseName' })
  }

  try {
    const existing_metadata = await getCourseMetadata(courseName)

    // Combine the existing metadata with the new metadata, prioritizing the new values (order matters!)
    const combined_metadata = { ...existing_metadata, ...courseMetadata }

    console.log('-----------------------------------------')
    console.log('EXISTING course metadata:', existing_metadata)
    console.log('passed into upsert metadata:', courseMetadata)
    console.log('FINAL COMBINED course metadata:', combined_metadata)
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Check if combined_metadata doesn't have anything in the field course_admins
    if (
      !combined_metadata.course_admins ||
      combined_metadata.course_admins.length === 0
    ) {
      combined_metadata.course_admins = superAdmins
      console.log('course_admins field was empty. Added default admin emails.')
    }

    // Check if combined_metadata doesn't have anything in the field is_private
    if (!combined_metadata.is_private) {
      combined_metadata.is_private = false
      console.log('is_private field was empty. Set to false.')
    }

    // Check if openai_api_key is present and if it is a plain string
    if (
      combined_metadata.openai_api_key &&
      !isEncrypted(combined_metadata.openai_api_key)
    ) {
      // Encrypt the openai_api_key
      console.log('Encrypting api key')
      combined_metadata.openai_api_key = await encrypt(
        combined_metadata.openai_api_key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      // console.log('Signed api key: ', combined_metadata.openai_api_key)
    }

    // Save the combined metadata
    await redisClient.hSet('course_metadatas', {
      [courseName]: JSON.stringify(combined_metadata),
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return res.status(500).json({ success: false, error: error })
  }
}
