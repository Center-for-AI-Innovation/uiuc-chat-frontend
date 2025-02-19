// src/pages/api/UIUC-api/moveToNewCourseMetadata.ts
import { type CourseMetadata } from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { redisClient } from '~/utils/redisClient'
// export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    // Fetch all keys from the KV store
    // Filter out keys that end with '_metadata'
    const oldMetadataKeys = await redisClient.keys('*_metadata')
    console.log('Starting migration for keys: ', oldMetadataKeys.length)

    // Create an array to store the old keys
    const processedKeys = []

    // Iterate over each old metadata key
    for (const oldKey of oldMetadataKeys) {
      // Fetch the old metadata
      const oldMetadataString = await redisClient.get(oldKey)
      if (!oldMetadataString) throw new Error('Old metadata not found')
      const oldMetadata: CourseMetadata = JSON.parse(oldMetadataString)

      // Extract the course name from the old key
      const courseName = oldKey.replace('_metadata', '')

      // Fetch the existing metadata for the course from the new structure
      const existingMetadata: CourseMetadata = JSON.parse(
        (await redisClient.hGet('course_metadatas', courseName)) || '{}',
      ) as CourseMetadata

      // Merge the old metadata with the existing metadata
      const updatedMetadata = { ...existingMetadata, ...oldMetadata }

      // Save the updated metadata in the new structure
      await redisClient.hSet('course_metadatas', {
        [courseName]: JSON.stringify(updatedMetadata),
      })
      console.log('Updating the course metadata in courseName:', courseName)

      // Delete the old metadata
      // await redisClient.del(oldKey)
      // console.log('Deleting key', oldKey)

      // Add the old key to the processedKeys array
      processedKeys.push(oldKey)
    }

    // Print all the old keys
    fs.writeFileSync('processedKeys.json', JSON.stringify(processedKeys))
    // console.log('Processed keys:', processedKeys)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error migrating course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
