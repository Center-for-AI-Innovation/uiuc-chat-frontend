import React, { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { writeAccessTokenCookie } from '~/utils/auth/accessTokenCookie'
import { useRenewalWatchdog } from '~/hooks/useRenewalWatchdog'

export function AuthCookie({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const [cookieWritten, setCookieWritten] = useState(false)

  // Renewal + cookie-clearing on logout live in the watchdog (mounted here so
  // it's inside the OIDC provider and wraps the whole app).
  useRenewalWatchdog()

  const token = auth.user?.access_token

  // Persist the access token whenever it changes — including after each silent
  // renewal (keyed on the token string, NOT gated on isLoading, so a renewed
  // token is written through immediately). Removal is NOT done here: a transient
  // unauthenticated render must not wipe the cookie; the watchdog clears it on
  // sign-out / user-unloaded.
  useEffect(() => {
    if (!auth.isAuthenticated || !token) return
    writeAccessTokenCookie(token)
    setCookieWritten(true)
  }, [token, auth.isAuthenticated])

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>
  }

  // Don't render children until the cookie is written for authenticated users,
  // so no page component fires an API request before the token cookie exists.
  if (auth.isAuthenticated && !cookieWritten) {
    return <div>Loading... </div>
  }

  return <>{children}</>
}
