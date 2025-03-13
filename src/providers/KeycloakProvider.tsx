import { AuthProvider } from 'react-oidc-context'
import { ReactNode, useEffect, useState } from 'react'
import { WebStorageStateStore } from 'oidc-client-ts'

interface AuthProviderProps {
  children: ReactNode
}

const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

// Function to save the current path before login
const saveCurrentPath = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search
    // Don't save the login callback URL with all the OIDC parameters
    if (!currentPath.includes('state=') && !currentPath.includes('code=')) {
      localStorage.setItem('auth_redirect_path', currentPath)
      console.log('Saved redirect path:', currentPath)
    }
  }
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
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
        // Retrieve the saved path or default to home page
        const redirectPath = localStorage.getItem('auth_redirect_path') || '/'
        console.log('Retrieved redirect path:', redirectPath)

        // Clear the saved path
        localStorage.removeItem('auth_redirect_path')

        window.location.href = redirectPath
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
        userStore: new WebStorageStateStore({
          store: window.localStorage
        }),
        automaticSilentRenew: true,
      }))

      // Only save the path when component mounts if we're not on the callback URL
      if (!window.location.search.includes('state=') && !window.location.search.includes('code=')) {
        saveCurrentPath()
      }
    }
  }, [])

  // Add effect to save the path when user clicks login
  useEffect(() => {
    // Add event listener for login button clicks
    const handleLoginClick = () => {
      saveCurrentPath()
    }

    // Find login buttons by commonly used selectors
    const loginButtons = document.querySelectorAll('.login-btn, [data-login], button[type="login"]')
    loginButtons.forEach(button => {
      button.addEventListener('click', handleLoginClick)
    })

    return () => {
      // Clean up event listeners on unmount
      loginButtons.forEach(button => {
        button.removeEventListener('click', handleLoginClick)
      })
    }
  }, [isMounted])

  // Don't render anything during SSR or before client-side mount
  if (typeof window === 'undefined' || !isMounted) {
    return null
  }

  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>
}
