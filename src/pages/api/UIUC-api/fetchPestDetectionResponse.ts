// src/pages/api/UIUC-api/callPestDetection.ts


/**
 * Fetches the pest detection response from the pest detection API.
 * @param imageUrls The image urls to send to the API
 * @returns The response from the API as s3 paths for the annotated images for the detected pests.
 */

export const fetchPestDetectionResponse = async (
  imageUrls: string[],
): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://kastanday--v2-pest-detection-yolo-model-predict.modal.run/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_urls: imageUrls }),
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error calling pest detection API:', error)
    throw error
  }
}
