import { AuthProvider } from 'react-oidc-context'
import { ReactNode, useEffect, useState } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  const [oidcConfig, setOidcConfig] = useState({
    authority: process.env.NEXT_PUBLIC_KEYCLOAK_URL + '/realms/myrealm',
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiuc-chat',
    redirect_uri: '', 
    silent_redirect_uri: '',
    post_logout_redirect_uri: '',
    scope: 'openid profile email',
    response_type: 'code',
    loadUserInfo: true,
    onSigninCallback: () => {
      return
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[KeycloakProvider] Initializing with origin:', window.location.origin)
      setOidcConfig(config => ({
        ...config,
        redirect_uri: window.location.origin + '/sign-in',
        silent_redirect_uri: window.location.origin + '/silent-renew',
        post_logout_redirect_uri: window.location.origin,
      }))
    }
  }, [])

  if (typeof window === 'undefined' || !oidcConfig.redirect_uri) {
    return null
  }

  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  )
}