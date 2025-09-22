let cachedConfig: {
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
} | null = null

export async function getRuntimeConfig() {
  if (cachedConfig) return cachedConfig
  try {
    const res = await fetch('/api/runtime-config', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load runtime config')
    cachedConfig = await res.json()
    return cachedConfig
  } catch (err) {
    // Fallback to build-time envs if API fails
    const isBrowser = typeof window !== 'undefined'
    const hostname = isBrowser ? window.location.hostname : 'localhost'
    const origin = isBrowser ? window.location.origin : 'http://localhost:3000'
    const defaultUrl = hostname === 'localhost' ? 'http://localhost:8080/' : `${origin}/keycloak/`
    cachedConfig = {
      keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL || defaultUrl,
      keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois_chat_realm',
      keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiuc-chat-client',
    }
    return cachedConfig
  }
}


