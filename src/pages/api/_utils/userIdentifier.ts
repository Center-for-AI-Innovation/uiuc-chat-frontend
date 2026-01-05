import { type AuthenticatedRequest } from '~/utils/authMiddleware'

export function getUserIdentifier(req: AuthenticatedRequest): string | null {
  const userEmail = req.user?.email as string | undefined
  if (userEmail && userEmail.trim() !== '') {
    return userEmail
  }

  const headerEmail = req.headers['x-user-email'] as string | undefined
  if (headerEmail && headerEmail.trim() !== '') {
    return headerEmail
  }

  const posthogId = req.headers['x-posthog-id'] as string | undefined
  if (posthogId && posthogId.trim() !== '') {
    return posthogId
  }

  return null
}
