// Browser-side read/write of the access-token cookie that the server gates
// (`withAuth` / `withAppRouterAuth`) read. Kept as a tiny module so the cookie
// name + options live in one place, shared by AuthCookie (write on token
// change) and the renewal watchdog (clear on sign-out).

import { CookieStorage } from '~/providers/CookieStorage'

export const ACCESS_TOKEN_COOKIE = 'access_token'

function makeStore(): CookieStorage {
  return new CookieStorage({
    // Mark Secure only on https so localhost (http) dev still sends the cookie.
    secure:
      typeof window !== 'undefined' && window.location.protocol === 'https:',
  })
}

/** Persist the access token so server gates can read it from the cookie. */
export function writeAccessTokenCookie(token: string): void {
  makeStore().setItem(ACCESS_TOKEN_COOKIE, token)
}

/** Remove the access-token cookie (on sign-out / user-unloaded). */
export function clearAccessTokenCookie(): void {
  makeStore().removeItem(ACCESS_TOKEN_COOKIE)
}
