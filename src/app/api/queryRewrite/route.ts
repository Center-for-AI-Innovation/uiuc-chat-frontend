// src/app/api/queryRewrite/route.ts

// Configure for Node.js runtime with larger payload support
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: false
  },
}

import { routeModelRequest } from '~/utils/streamProcessing'
import { type ChatBody } from '@/types/chat'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const response = await routeModelRequest(body as ChatBody)
    return response
  } catch (error) {
    console.error('Error in query rewrite route:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process query rewrite request',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}