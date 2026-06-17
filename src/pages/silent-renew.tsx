import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { useEffect, useRef } from 'react'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'

/**
 * OIDC silent-renew callback page. Loaded in a hidden iframe when the access
 * token expires; must call signinSilentCallback() to complete the renewal.
 */
export default function SilentRenew() {
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || typeof window === 'undefined') return
    handled.current = true

    const userManager = new UserManager({
      authority: `${getKeycloakBaseUrl()}realms/${
        process.env.NEXT_PUBLIC_KEYCLOAK_REALM
      }`,
      client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat',
      redirect_uri: window.location.origin,
      silent_redirect_uri: `${window.location.origin}/silent-renew`,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    })

    void userManager.signinSilentCallback().catch((err: unknown) => {
      console.error('Silent renew callback failed:', err)
    })
  }, [])

  return null
}
