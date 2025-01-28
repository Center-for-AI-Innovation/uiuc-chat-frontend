// Deprecated: Remove Clerk import
// import { getAuth } from '@clerk/nextjs/server'
import { useAuth } from 'react-oidc-context'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Deprecated: Remove Clerk auth check
  // const { userId } = getAuth(req)
  
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  // Extract the token (assuming Bearer token format)
  const token = authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  // Load any data your application needs for the API route
  return res.status(200).json({ userId: token })
}