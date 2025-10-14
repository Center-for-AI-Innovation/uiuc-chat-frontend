import posthog from 'posthog-js'
import { generateAnonymousUserId } from '~/utils/cryptoRandom'

export function createHeaders(userEmail?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Prefer explicit user email when available
  if (userEmail && userEmail.trim() !== '') {
    headers['x-user-email'] = userEmail
    return headers
  }

  // Fallbacks for first page load or public bots where email may not be ready yet
  if (typeof window !== 'undefined') {
    try {
      // Try PostHog distinct id
      const distinctId = (posthog as any)?.get_distinct_id?.()
      if (typeof distinctId === 'string' && distinctId.trim() !== '') {
        headers['x-posthog-id'] = distinctId
        return headers
      }
    } catch (_) {
      // ignore
    }

    try {
      // Use a persisted anonymous id if available
      let anon = localStorage.getItem('anonymous_user_id') || ''
      if (!anon || anon.trim() === '') {
        // Generate and persist an anonymous id to stabilize the identifier across requests
        anon = generateAnonymousUserId()
        localStorage.setItem('anonymous_user_id', anon)
      }
      if (anon && anon.trim() !== '') {
        headers['x-posthog-id'] = anon
      }
    } catch (_) {
      // ignore storage errors
    }
  }

  return headers
}
