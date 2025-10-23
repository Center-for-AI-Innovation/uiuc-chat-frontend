import posthog from 'posthog-js'

export function createHeaders(userEmail?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Prefer explicit user email when available
  if (userEmail && userEmail.trim() !== '') {
    headers['x-user-email'] = userEmail
    return headers
  }

  // Fallback only to PostHog distinct id; avoid generating any custom ids
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
  }

  return headers
}
