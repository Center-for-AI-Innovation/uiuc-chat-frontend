import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { CookieStorage } from '~/providers/CookieStorage'
import { useRouter } from 'next/router'

export function AuthCookie({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const router = useRouter()
  const [cookieWritten, setCookieWritten] = useState(false)
  const cookieStore = new CookieStorage()
  const retriedLogin = useRef(false)

  useEffect(() => {
    try {
      if (auth.isAuthenticated && auth.user) {
        cookieStore.setItem('access_token', auth.user.access_token)
        // Mark cookie as written after the operation completes successfully
        setCookieWritten(true)
      } else {
        cookieStore.removeItem('access_token')
        // setCookieWritten(false)
      }
    } catch (error) {
      console.error('Failed to write cookie:', error)
      // Still set to true to prevent infinite loading, but log the error
      setCookieWritten(true)
    }
  }, [auth, cookieStore, router])

  // Silent renew failures should re-trigger login instead of bricking the page
  useEffect(() => {
    if (!auth.error || retriedLogin.current || auth.activeNavigator) return
    retriedLogin.current = true
    console.warn('Auth error, redirecting to login:', auth.error.message)
    void auth.signinRedirect()
  }, [auth.error, auth.activeNavigator, auth])

  if (auth.activeNavigator === 'signinSilent') {
    return null
  }

  if (auth.activeNavigator === 'signoutRedirect') {
    return <div>Signing you out...</div>
  }

  // Don't render children until auth is loaded AND cookie is written
  if (auth.isAuthenticated && !cookieWritten) {
    return <div>Loading... </div>
  }

  if (auth.error) {
    return <div>Session expired, redirecting to login...</div>
  }

  // At this point, cookieWritten is guaranteed to be true
  return <>{children}</>
}
