export const initiateSignIn = (auth: any, redirectPath: string) => {
  console.log('[AuthHelper] Initiating sign in with redirect:', redirectPath)
  // Use URL-safe base64 encoding
  const state = btoa(
    JSON.stringify({
      redirect: redirectPath,
      timestamp: Date.now(),
    }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return auth.signinRedirect({ state })
}

// frontend
export const getKeycloakBaseUrl = () => {
  if (
    process.env.NEXT_PUBLIC_KEYCLOAK_URL &&
    process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== ''
  ) {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL
  }

  if (typeof window === 'undefined') return ''

  const hostname = window.location.hostname

  if (hostname === 'localhost') {
    return 'http://localhost:8080/'
  }

  if (hostname === 'uiuc.chat') {
    return 'https://login.uiuc.chat/'
  }

  return `${window.location.origin}/keycloak/`
}

// backend - used for network requests (JWKS key fetching)
export function getKeycloakBaseFromHost(hostname: string | undefined): string {
  // Server-side: prefer KEYCLOAK_URL for container-to-container communication
  if (typeof window === 'undefined' && process.env.KEYCLOAK_URL) {
    return process.env.KEYCLOAK_URL
  }

  if (
    process.env.NEXT_PUBLIC_KEYCLOAK_URL &&
    process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== ''
  ) {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL
  }
  if (hostname === 'localhost') return 'http://localhost:8080/'
  if (hostname === 'uiuc.chat') return 'https://login.uiuc.chat/'
  return `https://${hostname}/keycloak/`
}

// Returns the public-facing Keycloak URL that matches the issuer claim in JWTs.
// This must match Keycloak's --hostname setting, NOT the internal Docker URL.
export function getKeycloakIssuerBaseUrl(hostname: string | undefined): string {
  if (
    process.env.NEXT_PUBLIC_KEYCLOAK_URL &&
    process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== ''
  ) {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL
  }
  if (hostname === 'localhost') return 'http://localhost:8080/'
  if (hostname === 'uiuc.chat') return 'https://login.uiuc.chat/'
  return `https://${hostname}/keycloak/`
}
