import { AuthProvider } from 'react-oidc-context'
import { ReactNode, useEffect, useState } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  // Add state to track if we're on client side
  const [isMounted, setIsMounted] = useState(false)
  
  const [oidcConfig, setOidcConfig] = useState({
    authority: process.env.NEXT_PUBLIC_KEYCLOAK_URL + '/realms/myrealm',
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
    redirect_uri: '',  // Initialize empty, will set in useEffect
    silent_redirect_uri: '',
    post_logout_redirect_uri: '',
    scope: 'openid profile email',
    response_type: 'code',
    loadUserInfo: true,
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
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
          console.log('[KeycloakProvider][onSigninCallback] No code found, redirecting to homepage')
          window.location.replace('/')
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
              console.log('[KeycloakProvider][onSigninCallback] Error parsing state, redirecting to homepage')
              window.location.replace('/')
            }
          } else {
            // No state parameter, redirect to homepage
            console.log('[KeycloakProvider][onSigninCallback] No state found, redirecting to homepage')
            window.location.replace('/')
          }
        } catch (e) {
          console.error('[KeycloakProvider][onSigninCallback] Error processing callback:', e)
          console.log('[KeycloakProvider][onSigninCallback] Error in callback, redirecting to homepage')
          window.location.replace('/')
        }
      }
    }
  })

  // Set up client-side values after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true)
      setOidcConfig(prev => ({
        ...prev,
        redirect_uri: window.location.origin + '/sign-in',
        silent_redirect_uri: window.location.origin + '/silent-renew',
        post_logout_redirect_uri: window.location.origin
      }))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      const params = new URLSearchParams(window.location.search)
      const isCallback = params.has('code') && params.has('state')
      
      console.log('[KeycloakProvider][useEffect] Current state:', {
        isCallback,
        search: window.location.search,
        hasCode: params.has('code'),
        hasState: params.has('state'),
        currentConfig: oidcConfig
      })

      // If we don't have a redirect_uri, redirect to homepage
      if (!oidcConfig.redirect_uri) {
        console.log('[KeycloakProvider][useEffect] No redirect URI found, redirecting to homepage')
        window.location.replace('/')
        return
      }
    }
  }, [oidcConfig, isMounted])

  // Don't render anything during SSR or before client-side mount
  if (typeof window === 'undefined' || !isMounted) {
    console.log('[KeycloakProvider] Not rendering - SSR or not mounted')
    return null
  }

  console.log('[KeycloakProvider] Rendering with config:', {
    hasRedirectUri: !!oidcConfig.redirect_uri,
    redirectUri: oidcConfig.redirect_uri,
    currentUrl: window.location.href
  })

  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  )
}