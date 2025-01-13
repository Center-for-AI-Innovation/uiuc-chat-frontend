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
      if (typeof window !== 'undefined') {
        console.log('[KeycloakProvider] Processing signin callback')
        
        // Get the current URL parameters
        const params = new URLSearchParams(window.location.search)
        const state = params.get('state')
        
        // Clear URL parameters first
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        )
        
        // Then handle redirect
        let redirectUrl = '/'
        if (state) {
          try {
            const stateObj = JSON.parse(decodeURIComponent(state))
            if (stateObj.redirect) {
              redirectUrl = stateObj.redirect
            }
          } catch (e) {
            console.error('[KeycloakProvider] Failed to parse state:', e)
          }
        }
        
        // Use replace instead of push to avoid adding to history
        window.location.replace(redirectUrl)
      }
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