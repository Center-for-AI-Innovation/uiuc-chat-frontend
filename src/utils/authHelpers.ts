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
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL;
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

// backend
export function getKeycloakBaseFromHost(hostname: string|undefined): string {
  // For server-side requests in Docker, use the service name for JWKS fetching
  if (typeof window === 'undefined' && process.env.KEYCLOAK_URL) {
    return process.env.KEYCLOAK_URL;
  }
  
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  }
  if (hostname === 'localhost') return 'http://localhost:8080/';
  if (hostname === 'uiuc.chat') return 'https://login.uiuc.chat/';
  return `https://${hostname}/keycloak/`;
}

// Get issuer URL (always use public URL since that's what Keycloak issues)
export function getKeycloakIssuerUrl(hostname: string|undefined): string {
  // Always use the public URL for issuer verification
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== '') {
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'illinois_chat_realm';
    return `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${realm}`;
  }
  if (hostname === 'localhost') return 'http://localhost:8080/realms/illinois_chat_realm';
  if (hostname === 'uiuc.chat') return 'https://login.uiuc.chat/realms/illinois_chat_realm';
  return `https://${hostname}/keycloak/realms/illinois_chat_realm`;
}
