// src/pages/api/UIUC-api/moveToNewCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type CourseMetadata } from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
// export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    // Fetch all keys from the KV store
    // Filter out keys that end with '_metadata'
    const oldMetadataKeys = await kv.keys('*_metadata')
    // console.log('Starting migration for keys: ', oldMetadataKeys.length)

    // Create an array to store the old keys
    const processedKeys = []

    // Iterate over each old metadata key
    for (const oldKey of oldMetadataKeys) {
      // Fetch the old metadata
      const oldMetadata: CourseMetadata = (await kv.get(
        oldKey,
      )) as CourseMetadata

      // Extract the course name from the old key
      const courseName = oldKey.replace('_metadata', '')

      // Fetch the existing metadata for the course from the new structure
      const existingMetadata: CourseMetadata | object =
        (await kv.hget('course_metadatas', courseName)) || {}

      // Merge the old metadata with the existing metadata
      const updatedMetadata = { ...existingMetadata, ...oldMetadata }

      // Save the updated metadata in the new structure
      await kv.hset('course_metadatas', { [courseName]: updatedMetadata })
      console.log('Updating the course metadata in courseName:', courseName)

      // Delete the old metadata
      // await kv.del(oldKey)
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
