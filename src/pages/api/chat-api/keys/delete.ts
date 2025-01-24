// import { supabase } from '@/utils/supabaseClient'
// import { getAuth } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

type ApiResponse = {
  message?: string
  data?: any
  error?: string
}

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */
export default async function deleteKey(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  try {
    // Get user ID from Keycloak token
    const token = authHeader.replace('Bearer ', '')
    const [, payload = ''] = token.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
    const subId = decodedPayload.sub
    const userId = decodedPayload.user_id || subId // Fallback to sub if user_id not present

    console.log('Deleting api key for:', userId)

    const { data, error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .match({ user_id: subId })

    if (error) {
      console.error('Error deleting API key:', error)
      throw error
    }

    posthog.capture('api_key_deleted', {
      subId,
    })

    return res.status(200).json({
      message: 'API key deleted successfully',
      data,
    })
  } catch (error) {
    console.error('Failed to delete API key:', error)

    posthog.capture('api_key_deletion_failed', {
      error: (error as Error).message,
    })

    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
