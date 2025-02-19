// src/pages/api/UIUC-api/backupOldCourseMetadata.ts
import { type CourseMetadata } from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { redisClient } from '~/utils/redisClient'

export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    // Fetch all keys from the KV store
    // Filter out keys that end with '_metadata'
    const oldMetadataKeys = await redisClient.keys('*_metadata')
    console.log('Starting backup for keys: ', oldMetadataKeys.length)

    // Create an array to store the old metadata along with keys
    const oldMetadatas = []

    // Iterate over each old metadata key
    for (const oldKey of oldMetadataKeys) {
      // Fetch the old metadata
      const oldMetadataString = await redisClient.get(oldKey)
      if (!oldMetadataString) throw new Error('Old metadata not found')
      const oldMetadata = JSON.parse(oldMetadataString) as CourseMetadata

      // Add the old metadata along with its key to the oldMetadatas array
      oldMetadatas.push({ key: oldKey, value: oldMetadata })
    }

    // Write the old metadata along with keys to a file
    const filePath = join(process.cwd(), 'backupOldCourseMetadatas.json')
    await fs.writeFile(filePath, JSON.stringify(oldMetadatas, null, 2))
    console.log('Old metadata along with keys saved to file:', filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error backing up old course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
