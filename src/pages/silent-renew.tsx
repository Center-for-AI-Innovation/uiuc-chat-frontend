import { useEffect } from 'react'
import { UserManager } from 'oidc-client-ts'
import { buildOidcSettings } from '~/config/oidcConfig'

/**
 * OIDC silent-renew callback target (loaded inside a hidden iframe).
 *
 * This is the FALLBACK renewal path: with a refresh token present,
 * oidc-client-ts renews via the refresh-token grant and never loads this page.
 * It exists to (a) remove the previously-dangling `silent_redirect_uri` 404 and
 * (b) handle the iframe path if no refresh token is available. It parses the
 * auth response from the URL and postMessages the result to the parent window's
 * UserManager.
 */
export default function SilentRenew() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    new UserManager(buildOidcSettings())
      .signinSilentCallback()
      .catch((err) => console.error('Silent renew callback failed:', err))
  }, [])

  return null
}
