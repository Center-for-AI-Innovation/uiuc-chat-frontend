import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import axios from 'axios'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

interface ScrapeRequestBody {
  url: string | null
  courseName: string | null
  maxUrls: number
  scrapeStrategy: string
}

export default withCourseOwnerOrAdminAccess()(handler)

const formatUrl = (url: string) => {
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url
  }
  return url
}

const formatUrlAndMatchRegex = (url: string) => {
  // fullUrl always starts with http://. Is the starting place of the scrape.
  // baseUrl is used to construct the match statement.

  // Ensure the url starts with 'http://'
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url
  }

  // Extract the base url including the path
  const baseUrl = (
    url.replace(/^https?:\/\//i, '').split('?')[0] as string
  ).replace(/\/$/, '') // Remove protocol (http/s), split at '?', and remove trailing slash

  const matchRegex = `http?(s)://**${baseUrl}/**`

  return {
    fullUrl: baseUrl,
    matchRegex: matchRegex,
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, courseName, maxUrls, scrapeStrategy } =
    req.body as ScrapeRequestBody

  if (!url || !courseName) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const fullUrl = formatUrl(url)
    const postParams = {
      url: fullUrl,
      courseName: courseName,
      maxPagesToCrawl: maxUrls,
      scrapeStrategy: scrapeStrategy,
      match: formatUrlAndMatchRegex(fullUrl).matchRegex,
      maxTokens: 2000000,
    }

    const crawleeApiUrl = process.env.CRAWLEE_API_URL
    if (!crawleeApiUrl) {
      return res.status(500).json({ error: 'CRAWLEE_API_URL is not set' })
    }
    const response = await axios.post(crawleeApiUrl, { params: postParams })

    return res.status(200).json(response.data)
  } catch (error: any) {
    console.error('Web scraping error:', error)

    return res.status(500).json({
      error: 'Web scraping failed. Please try again later.',
      message: error.message,
    })
  }
}
