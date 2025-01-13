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
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
        // Get the current URL parameters
        const params = new URLSearchParams(window.location.search)
        const state = params.get('state')
        const code = params.get('code')

        console.log('[KeycloakProvider][onSigninCallback] URL params:', {
          state,
          code,
          fullSearch: window.location.search
        })

        // Only process if this is actually an auth callback
        if (!code) {
          console.log('[KeycloakProvider][onSigninCallback] No code found, skipping callback processing')
          return
        }

        console.log('[KeycloakProvider][onSigninCallback] Processing signin callback')
        
        try {
          // Clear the URL parameters first to prevent loops
          console.log('[KeycloakProvider][onSigninCallback] Clearing URL parameters')
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          )
          
          // Parse state if it exists
          if (state) {
            try {
              const stateObj = JSON.parse(decodeURIComponent(state))
              const redirectPath = stateObj.redirect || '/'
              console.log('[KeycloakProvider][onSigninCallback] State parsed:', stateObj)
              console.log('[KeycloakProvider][onSigninCallback] Redirecting to:', redirectPath)
              window.location.replace(redirectPath)
              return
            } catch (parseError) {
              console.error('[KeycloakProvider][onSigninCallback] Error parsing state:', parseError)
            }
          }
          
          // Default redirect
          console.log('[KeycloakProvider][onSigninCallback] No state found, redirecting to /')
          window.location.replace('/')
        } catch (e) {
          console.error('[KeycloakProvider][onSigninCallback] Error processing callback:', e)
          window.location.replace('/')
        }
      }
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const isCallback = params.has('code') && params.has('state')
      
      console.log('[KeycloakProvider][useEffect] Current state:', {
        isCallback,
        search: window.location.search,
        hasCode: params.has('code'),
        hasState: params.has('state')
      })
      
      // Don't update config during callback processing
      if (!isCallback) {
        console.log('[KeycloakProvider][useEffect] Initializing with origin:', window.location.origin)
        setOidcConfig(config => ({
          ...config,
          redirect_uri: window.location.origin + '/sign-in',
          silent_redirect_uri: window.location.origin + '/silent-renew',
          post_logout_redirect_uri: window.location.origin,
        }))
      } else {
        console.log('[KeycloakProvider][useEffect] Skipping config update during callback')
      }
    }
  }, [])

  if (typeof window === 'undefined' || !oidcConfig.redirect_uri) {
    console.log('[KeycloakProvider] Not rendering - SSR or missing config:', {
      isSSR: typeof window === 'undefined',
      hasRedirectUri: !!oidcConfig.redirect_uri
    })
    return null
  }

  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  )
}