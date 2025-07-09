import type { NextApiRequest, NextApiResponse } from 'next'
import { exaSearch } from '@/services/exaService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  const apiKey = process.env.EXA_API_KEY
  if (!query || !apiKey) {
    return res.status(400).json({ error: 'Missing query or API key' })
  }

  try {
    const results = await exaSearch(query, apiKey)
    res.status(200).json({ results })
  } catch (e) {
    console.error('[API] exa.ai search error:', e)
    res.status(500).json({ error: 'Search failed' })
  }
}
