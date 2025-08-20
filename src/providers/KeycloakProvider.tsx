import { AuthProvider } from 'react-oidc-context'
import { type ReactNode, useEffect, useState } from 'react'
import { WebStorageStateStore } from 'oidc-client-ts'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'

interface AuthProviderProps {
  children: ReactNode
}

// --- Secure Redirect Path Validation ---
const isValidRedirectPath = (path: string): boolean => {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return false;
  const dangerousPatterns = [
    /^\/api\//,
    /^\/_next\//,
    /^\/admin\//,
    /^\/internal\//,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
  ];
  return !dangerousPatterns.some((pattern) => pattern.test(path));
};
// ---------------------------------------

const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

// Function to save the current path before login
const saveCurrentPath = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    if (
      !currentPath.includes('state=') &&
      !currentPath.includes('code=') &&
      isValidRedirectPath(currentPath)
    ) {
      sessionStorage.setItem('auth_redirect_path', currentPath);
    }
  }
}

export const KeycloakProvider = ({ children }: AuthProviderProps) => {
  // Add state to track if we're on client side
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
    onSigninCallback: async () => {
      if (typeof window !== 'undefined') {
        let redirectPath = sessionStorage.getItem('auth_redirect_path') || '/';
        if (!isValidRedirectPath(redirectPath)) redirectPath = '/';
        sessionStorage.removeItem('auth_redirect_path');
        window.location.replace(redirectPath);
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
          store: window.localStorage,
        }),
        automaticSilentRenew: true,
      }))

      // Only save the path when component mounts if we're not on the callback URL
      if (
        !window.location.search.includes('state=') &&
        !window.location.search.includes('code=')
      ) {
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

    // Function to find and attach listeners to login buttons
    const attachListeners = () => {
      // Find login buttons by commonly used selectors
      const loginButtons = document.querySelectorAll('.login-btn, [data-login], button[type="login"]')
      loginButtons.forEach((button) => {
        button.addEventListener('click', handleLoginClick)
      })
    }

    // Attach listeners immediately
    attachListeners()

    // Also set up a mutation observer to catch dynamically added buttons
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              // Check if the added element is a login button
              if (element.matches && element.matches('.login-btn, [data-login], button[type="login"]')) {
                element.addEventListener('click', handleLoginClick)
              }
              // Check if the added element contains login buttons
              const loginButtons = element.querySelectorAll('.login-btn, [data-login], button[type="login"]')
              loginButtons.forEach((button) => {
                button.addEventListener('click', handleLoginClick)
              })
            }
          })
        }
      })
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      // Clean up event listeners and observer on unmount
      const loginButtons = document.querySelectorAll('.login-btn, [data-login], button[type="login"]')
      loginButtons.forEach(button => {
        button.removeEventListener('click', handleLoginClick)
      })
      observer.disconnect()
    }
  }, [isMounted])

  // Don't render anything during SSR or before client-side mount
  if (typeof window === 'undefined' || !isMounted) {
    return null
  }

  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>
}
