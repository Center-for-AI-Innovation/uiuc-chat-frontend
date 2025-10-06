import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { getDefaultPostPrompt } from '~/app/utils/buildPromptUtils'

function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const defaultPrompt = getDefaultPostPrompt()
    console.log('defaultPrompt:', defaultPrompt)
    res.status(200).json({ prompt: defaultPrompt })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default withAuth(handler)
