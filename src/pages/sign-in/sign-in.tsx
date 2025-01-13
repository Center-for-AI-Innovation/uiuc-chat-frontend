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
    console.log('[SignInPage] Current URL:', window.location.href)
    console.log('[SignInPage] Auth state:', {
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      activeNavigator: auth.activeNavigator
    })

    // If we're processing a callback, don't do anything else
    if (window.location.search.includes('code=')) {
      console.log('[SignInPage] Processing callback, waiting...')
      setIsProcessingCallback(true)
      return
    }

    // If authenticated, redirect to the intended page
    if (auth.isAuthenticated) {
      console.log('[SignInPage] Authenticated, redirecting to:', redirect)
      void router.replace(redirect as string)
      return
    }

    // Only initiate signin if:
    // 1. Not processing callback
    // 2. Not loading
    // 3. Not authenticated
    // 4. No active navigator
    if (!isProcessingCallback && 
        !auth.isLoading && 
        !auth.isAuthenticated && 
        !auth.activeNavigator) {
      console.log('[SignInPage] Initiating signin redirect')
      void auth.signinRedirect({
        redirect_uri: window.location.origin + '/sign-in',
        state: JSON.stringify({ redirect })
      })
    }
  }, [auth.isLoading, auth.isAuthenticated, isProcessingCallback])

  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}