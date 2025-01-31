import { useAuth } from 'react-oidc-context'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      const currentPath = router.asPath
      // void router.push(`/sign-in?redirect=${encodeURIComponent(currentPath)}`)
      void auth.signinRedirect({
        state: JSON.stringify({ redirect: currentPath })
      })
    }
  }, [auth.isLoading, auth.isAuthenticated])

  if (auth.isLoading) {
    return null
  }

  return auth.isAuthenticated ? <>{children}</> : null
}