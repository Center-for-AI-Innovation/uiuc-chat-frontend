import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { CookieStorage } from '~/providers/CookieStorage'

export function AuthCookie({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  useEffect(() => {
    const cookieStore = new CookieStorage()
    if (auth.isAuthenticated && auth.user) {
      cookieStore.setItem('access_token', auth.user.access_token)
    } else {
      cookieStore.removeItem('access_token')
    }
  }, [auth.isAuthenticated, auth.user, auth.user?.access_token])

  return <>{children}</>
}
