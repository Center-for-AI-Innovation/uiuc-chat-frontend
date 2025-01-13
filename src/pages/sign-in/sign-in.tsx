import { useAuth } from 'react-oidc-context'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'

export default function SignInPage() {
  const auth = useAuth()
  const router = useRouter()
  const { redirect = '/' } = router.query
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)

  useEffect(() => {
    console.log('[SignInPage][Debug] Auth state changed:', {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      activeNavigator: auth.activeNavigator,
      isProcessingCallback,
      currentUrl: window.location.href,
      search: window.location.search,
      redirect
    })

    // If we're processing a callback, don't do anything else
    if (window.location.search.includes('code=')) {
      console.log('[SignInPage] Found code in URL, processing callback')
      setIsProcessingCallback(true)
      return
    }

    // Only initiate signin if no auth process is ongoing
    if (!isProcessingCallback && 
        !auth.isLoading && 
        !auth.isAuthenticated && 
        !auth.activeNavigator) {
      console.log('[SignInPage] Initiating signin redirect with state:', {
        redirect,
        currentPath: window.location.pathname
      })
      void auth.signinRedirect({
        state: JSON.stringify({ redirect })
      }).catch(error => {
        console.error('[SignInPage] Error during signin redirect:', error)
      })
    }
  }, [auth.isLoading, auth.isAuthenticated])

  // Log state changes
  useEffect(() => {
    console.log('[SignInPage][StateChange] Component state updated:', {
      isProcessingCallback,
      authLoading: auth.isLoading,
      authAuthenticated: auth.isAuthenticated,
      redirect
    })
  }, [isProcessingCallback, auth.isLoading, auth.isAuthenticated, redirect])

  // Show loading state during authentication
  if (auth.isLoading || isProcessingCallback) {
    console.log('[SignInPage] Showing loading state:', {
      authLoading: auth.isLoading,
      isProcessingCallback
    })
    return <LoadingSpinner />
  }

  // Redirect if already authenticated
  if (auth.isAuthenticated) {
    console.log('[SignInPage] User authenticated, redirecting to:', redirect)
    void router.replace(redirect as string)
    return null
  }

  console.log('[SignInPage] Rendering null - waiting for auth flow')
  return null
}