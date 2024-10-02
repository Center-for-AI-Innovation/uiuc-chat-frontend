import { NextApiRequest, NextApiResponse } from 'next'
import { getDefaultPostPrompt } from '~/pages/api/chat'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const defaultPrompt = getDefaultPostPrompt()
    console.log('defaultPrompt:', defaultPrompt)
    res.status(200).json({ prompt: defaultPrompt })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
