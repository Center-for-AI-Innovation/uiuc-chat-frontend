import { useAuth } from 'react-oidc-context'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'

export default function SignUpPage() {
  const auth = useAuth()
  const router = useRouter()
  const { redirect = '/' } = router.query

  useEffect(() => {
    if (auth.isAuthenticated) {
      void router.push(redirect as string)
    }
  }, [auth.isAuthenticated, redirect, router])

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Add registration hint to redirect to registration page in Keycloak
      void auth.signinRedirect({
        extraQueryParams: {
          kc_action: 'register'
        }
      })
    }
  }, [auth.isLoading])

  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}