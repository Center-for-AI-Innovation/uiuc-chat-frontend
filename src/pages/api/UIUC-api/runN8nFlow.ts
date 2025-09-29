import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'
import { NextApiResponse } from 'next'

// Common function to run N8N flow - can be used anywhere
export const runN8nFlowBackend = async (
  api_key: string,
  name: string,
  data: any,
): Promise<any> => {
  const backendUrl = getBackendUrl()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5minutes timeout

  try {
    const body = JSON.stringify({
      api_key: api_key,
      name: name,
      data: data,
    })

    const response = await fetch(`${backendUrl}/run_flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Better error handling - check if response is JSON or HTML
      const contentType = response.headers.get('content-type')
      let errorMessage = `Backend returned ${response.status}: ${response.statusText}`

      if (contentType && contentType.includes('application/json')) {
        try {
          const errjson = await response.json()
          errorMessage = errjson.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError)
        }
      } else {
        // It's probably HTML - get first 200 chars for debugging
        try {
          const errorText = await response.text()
          console.error(
            'Backend returned HTML error:',
            errorText.substring(0, 200),
          )
          errorMessage = `Backend returned HTML instead of JSON. Status: ${response.status}`
        } catch (textError) {
          console.error('Failed to read error response as text:', textError)
        }
      }

      throw new Error(errorMessage)
    }

    const n8nResponse = await response.json()
    return n8nResponse
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out after 30 seconds, try "Regenerate Response" button',
      )
    }

    throw error
  }
}

export default withAuth(handler)

// This function can run for a maximum of 5 minutes
export const config = {
  maxDuration: 300, // 5 minutes
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { api_key, name, data } = req.body

  if (!api_key || !name || !data) {
    return res.status(400).json({
      error: 'api_key, name, and data are required',
    })
  }

  try {
    // Use the common function
    const n8nResponse = await runN8nFlowBackend(api_key, name, data)
    return res.status(200).json(n8nResponse)
  } catch (error: any) {
    console.error('Error in runN8nFlow API:', error)

    if (error.message.includes('timed out')) {
      return res.status(408).json({ error: error.message })
    }

    return res.status(500).json({
      error: error.message || 'Internal server error while running N8N flow',
    })
  }
}
