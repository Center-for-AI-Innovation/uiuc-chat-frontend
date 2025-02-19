import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'edge'

export default async function handler(req: any, res: any) {
  const { n8nApiKey } = req.body
  // console.log(`Testing API key: '${n8nApiKey}'`)

  const parsedPagination = true
  const limit = 1

  const response = await fetch(
    `${process.env.RAILWAY_URL}/getworkflows?api_key=${n8nApiKey}&limit=${limit}&pagination=${parsedPagination}`,
  )

  if (!response.ok) {
    // return res.status(response.status).json({ error: response.statusText })
    throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
  }
  return res.status(200).json({ message: 'Success' })
  // console.log('Fetch was ok. ', await response.json())
}
