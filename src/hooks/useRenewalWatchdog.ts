import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'

import { clearAccessTokenCookie } from '~/utils/auth/accessTokenCookie'
import { initiateSignIn } from '~/utils/authHelpers'

const RENEW_COOLDOWN_MS = 5000
// Cap how long we wait for a silent renewal. The refresh-token grant goes
// through fetch with no client-side timeout, so without this a hung token
// request would leave `inFlightRef` set forever and suppress all future
// renewals/escalation.
const RENEW_TIMEOUT_MS = 15000

/**
 * Sitewide token-renewal safety net. Mounted once (inside the OIDC provider).
 *
 * - On access-token expiry / silent-renew error: attempts one renewal
 *   (single-flight + cooldown so overlapping events don't storm Keycloak).
 *   Only if that fails (refresh token truly dead) does it escalate to
 *   interactive login. Never redirects on the first hiccup.
 * - Clears the chunked cookie set on definitive sign-out / user-unloaded.
 *
 * `automaticSilentRenew`'s internal timer handles the steady-state renewal; the
 * primary multi-tab safeguard is disabling Keycloak refresh-token rotation (so
 * a not-yet-rotated token keeps working across tabs).
 */
export function useRenewalWatchdog(): void {
  const auth = useAuth()
  const escalatedRef = useRef(false)
  const inFlightRef = useRef<Promise<boolean> | null>(null)
  const lastAttemptRef = useRef(0)

  // Single-flight, cooldown-guarded renewal. Resolves true if a fresh, valid
  // token is available afterwards.
  const renew = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return inFlightRef.current
    if (Date.now() - lastAttemptRef.current < RENEW_COOLDOWN_MS) return false
    lastAttemptRef.current = Date.now()

    inFlightRef.current = (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        const user = await Promise.race([
          // .catch keeps a late rejection from becoming unhandled if the
          // timeout already won the race.
          auth.signinSilent().catch(() => null),
          new Promise<null>((resolve) => {
            timer = setTimeout(() => resolve(null), RENEW_TIMEOUT_MS)
          }),
        ])
        return !!user && !user.expired
      } finally {
        if (timer) clearTimeout(timer)
        inFlightRef.current = null
      }
    })()
    return inFlightRef.current
  }, [auth])

  useEffect(() => {
    const events = auth.events
    if (!events) return

    const escalate = () => {
      if (escalatedRef.current) return
      escalatedRef.current = true
      try {
        const redirectPath =
          typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : '/'
        void initiateSignIn(auth, redirectPath)
      } catch {
        /* escalation is best-effort */
      }
    }

    const handleExpiredOrError = async () => {
      const ok = await renew()
      if (ok) {
        // Recovered — allow a future failure to escalate again.
        escalatedRef.current = false
      } else {
        escalate()
      }
    }

    const handleSignedOut = () => clearAccessTokenCookie()

    const offExpired = events.addAccessTokenExpired(() => {
      void handleExpiredOrError()
    })
    const offRenewError = events.addSilentRenewError(() => {
      void handleExpiredOrError()
    })
    const offUnloaded = events.addUserUnloaded(handleSignedOut)
    const offSignedOut = events.addUserSignedOut(handleSignedOut)
    const offLoaded = events.addUserLoaded(() => {
      escalatedRef.current = false
    })

    return () => {
      offExpired?.()
      offRenewError?.()
      offUnloaded?.()
      offSignedOut?.()
      offLoaded?.()
    }
  }, [auth, renew])
}
