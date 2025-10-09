export function createHeaders(userEmail?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (userEmail) {
    headers['x-user-email'] = userEmail
  }

  return headers
}
