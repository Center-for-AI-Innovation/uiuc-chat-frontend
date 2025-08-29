import { AuthProvider } from 'react-oidc-context'
import { type ReactNode, useEffect, useState } from 'react'
import { WebStorageStateStore } from 'oidc-client-ts'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'

interface AuthProviderProps {
  children: ReactNode
}

const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [oidcConfig, setOidcConfig] = useState({
    authority: `${getKeycloakBaseUrl()}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`,
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
    redirect_uri: '',
    silent_redirect_uri: '',
    post_logout_redirect_uri: '',
    scope: 'openid profile email',
    response_type: 'code',
    loadUserInfo: true,
    // middleware now handles the post-signin redirect using cookies
    // onSigninCallback: async () => {
    // },
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
      const baseUrl = getBaseUrl()
      setOidcConfig((prev) => ({
        ...prev,
        redirect_uri: baseUrl,
        silent_redirect_uri: `${baseUrl}/silent-renew`,
        post_logout_redirect_uri: baseUrl,
        userStore: new WebStorageStateStore({ store: window.localStorage }),
        automaticSilentRenew: true,
      }))
    }
  }, [])

  if (typeof window === 'undefined' || !isMounted) return null
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>
}
