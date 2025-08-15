import { QdrantClient } from '@qdrant/js-client-rest'

// Create default Qdrant client instance
export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

// Create CropWizard-specific Qdrant client instance
export const cropwizardQdrant = new QdrantClient({
  url: process.env.CROPWIZARD_QDRANT_URL,
  apiKey: process.env.CROPWIZARD_QDRANT_API_KEY,
})

/**
 * Get the appropriate Qdrant client based on course name
 * @param courseName - The course name to check
 * @returns The appropriate Qdrant client
 * 
 * @example
 * // For regular courses
 * const client = getQdrantClient('cs101')
 * 
 * // For CropWizard courses
 * const client = getQdrantClient('cropwizard-corn-2024')
 */
export function getQdrantClient(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    console.log(`Using CropWizard Qdrant client for course: ${courseName}`)
    return cropwizardQdrant
  }
  return qdrant
}

/**
 * Get the appropriate Qdrant collection name based on course name
 * @param courseName - The course name to check
 * @returns The appropriate collection name
 */
export function getQdrantCollectionName(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return process.env.CROPWIZARD_QDRANT_COLLECTION_NAME || process.env.QDRANT_COLLECTION_NAME
  }
  return process.env.QDRANT_COLLECTION_NAME
}
