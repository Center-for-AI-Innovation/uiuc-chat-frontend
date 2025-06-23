export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { api_key, name, data } = req.body

  if (!api_key || !name || !data) {
    return res.status(400).json({ 
      error: 'api_key, name, and data are required' 
    })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const body = JSON.stringify({
      api_key: api_key,
      name: name,
      data: data,
    })

    const response = await fetch(
      `${process.env.RAILWAY_URL}/run_flow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: body,
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errjson = await response.json()
      console.error('Error calling n8n function:', errjson.error)
      return res.status(response.status).json({ error: errjson.error })
    }

    const n8nResponse = await response.json()
    return res.status(200).json(n8nResponse)
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timed out after 30 seconds, try "Regenerate Response" button' 
      })
    }
    
    console.error('Error in runN8nFlow API:', error)
    return res.status(500).json({ 
      error: 'Internal server error while running N8N flow' 
    })
  }
}