import { AuthProvider } from 'react-oidc-context'
import { ReactNode, useEffect, useState } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  // Add state to track if we're on client side
  const [isMounted, setIsMounted] = useState(false)

  const [oidcConfig, setOidcConfig] = useState({
    authority:
      process.env.NEXT_PUBLIC_KEYCLOAK_URL +
      'realms/' +
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
    redirect_uri: '',
    silent_redirect_uri: '',
    post_logout_redirect_uri: '',
    scope: 'openid profile email',
    response_type: 'code',
    loadUserInfo: true,
    userStore: 'local',
    automaticSilentRenew: true,
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
        // First clean up the URL by removing query parameters
        window.history.replaceState(
          {},
          document.title,
          '/'  // Change this to '/' to redirect to homepage
        )
      }
    },
  })

  // Set up client-side values after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
      const baseUrl = getBaseUrl()

      setOidcConfig((prev) => ({
        ...prev,
        redirect_uri: baseUrl,
        silent_redirect_uri: `${baseUrl}/silent-renew`,
        post_logout_redirect_uri: baseUrl,
      }))
    }
  }, [])

  // Don't render anything during SSR or before client-side mount
  if (typeof window === 'undefined' || !isMounted) {
    return null
  }

  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>
}
