import { type AuthenticatedRequest, type NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'
// THIS HAS BEEN MOVED TO 100% CLIENT SIDE. Currently in onMessageRecieved() in Chat.tsx
