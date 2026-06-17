import { WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts'
import { getKeycloakBaseUrl } from '~/utils/authHelpers'

const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM
const KEYCLOAK_CLIENT_ID =
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'uiucchat'

/**
 * Single source of truth for the OIDC `UserManagerSettings`.
 *
 * Used by both `KeycloakProvider` (spread into `<AuthProvider>`) and the
 * `/silent-renew` fallback page (`new UserManager(buildOidcSettings())`) so the
 * two agree byte-for-byte — any authority/client_id mismatch breaks silent
 * renewal and callback parsing.
 *
 * Must be called in the browser only (reads `window`). Callers gate on mount;
 * the throw is a guard so a stray SSR/import-time call fails loudly instead of
 * producing a half-formed config.
 */
export function buildOidcSettings(): UserManagerSettings {
  if (typeof window === 'undefined') {
    throw new Error('buildOidcSettings() must be called in the browser')
  }

  const origin = window.location.origin

  return {
    authority: `${getKeycloakBaseUrl()}realms/${KEYCLOAK_REALM}`,
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: origin,
    silent_redirect_uri: `${origin}/silent-renew`,
    post_logout_redirect_uri: origin,
    scope: 'openid profile email',
    response_type: 'code',
    // Kept true to preserve existing profile claims behaviour. Adds a
    // /userinfo round-trip per renewal; can be set false once we confirm the
    // UI only reads claims already present in the token.
    loadUserInfo: true,
    // Refresh-token silent renewal (no iframe for the common path).
    automaticSilentRenew: true,
    // Renew well before expiry, with margin for client/server clock skew.
    accessTokenExpiringNotificationTimeInSeconds: 90,
    // No check-session iframe: avoids third-party-cookie / CSP frame issues.
    // Cross-tab logout is therefore not auto-propagated (acceptable: tokens are
    // short-lived and the watchdog clears on userUnloaded/signedOut).
    monitorSession: false,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  }
}
