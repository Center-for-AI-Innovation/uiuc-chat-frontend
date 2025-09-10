import { QdrantClient } from '@qdrant/js-client-rest'

// Default Qdrant client (legacy)
export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

// CropWizard-specific Qdrant client
export const cropwizardQdrant = new QdrantClient({
  url: process.env.CROPWIZARD_QDRANT_URL,
  apiKey: process.env.CROPWIZARD_QDRANT_API_KEY,
})

export function getQdrantClient(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return cropwizardQdrant
  }
  return qdrant
}

export function getQdrantCollectionName(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return process.env.CROPWIZARD_QDRANT_COLLECTION_NAME
  }
  return process.env.QDRANT_COLLECTION_NAME
}
