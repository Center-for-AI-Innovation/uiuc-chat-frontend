import { withAuth } from '~/utils/authMiddleware'
import { getBackendUrl } from '~/utils/apiUtils'

// export const runtime = 'edge'

async function handler(req: any, res: any) {
  const { n8nApiKey } = req.body
  // console.log(`Testing API key: '${n8nApiKey}'`)

  const parsedPagination = true
  const limit = 1

  const response = await fetch(
    `${getBackendUrl()}/getworkflows?api_key=${n8nApiKey}&limit=${limit}&pagination=${parsedPagination}`,
  )

  if (!response.ok) {
    // return res.status(response.status).json({ error: response.statusText })
    throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
  }
  return res.status(200).json({ message: 'Success' })
  // console.log('Fetch was ok. ', await response.json())
}

export default withAuth(handler)
