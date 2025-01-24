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
  
  const auth = useAuth()
  const userId = auth.user?.profile.sub // OIDC subject identifier
  
  // Load any data your application needs for the API route
  return res.status(200).json({ userId })
}