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
  console.log('[AuthHelper] NEXT_PUBLIC_KEYCLOAK_URL:', process.env.NEXT_PUBLIC_KEYCLOAK_URL);
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== '') {
    console.log('[AuthHelper] Using env var:', process.env.NEXT_PUBLIC_KEYCLOAK_URL);
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  }

  if (typeof window === 'undefined') return ''

  const hostname = window.location.hostname

  if (hostname === 'localhost') {
    return 'http://localhost:55612/auth/'
  }

  if (hostname === 'uiuc.chat') {
    return 'https://login.uiuc.chat/'
  }

  return `${window.location.origin}/keycloak/`
}

// backend
export function getKeycloakBaseFromHost(hostname: string, protocol: string): string {
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  }
  if (hostname === 'localhost') return 'http://localhost:55612/auth/';
  if (hostname === 'uiuc.chat') return 'https://login.uiuc.chat/';
  return `${protocol}://${hostname}/keycloak/`;
}
