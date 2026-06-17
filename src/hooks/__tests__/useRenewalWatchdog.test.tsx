import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const initiateSignIn = vi.fn()
vi.mock('~/utils/authHelpers', () => ({
  initiateSignIn: (...args: unknown[]) => initiateSignIn(...args),
}))
const clearAccessTokenCookie = vi.fn()
vi.mock('~/utils/auth/accessTokenCookie', () => ({
  clearAccessTokenCookie: () => clearAccessTokenCookie(),
}))
const authMock = vi.fn()
vi.mock('react-oidc-context', () => ({
  useAuth: () => authMock(),
}))

import { useRenewalWatchdog } from '../useRenewalWatchdog'

type Handler = (...args: unknown[]) => void

function makeAuth(signinSilent: () => Promise<unknown>) {
  const handlers: Record<string, Handler> = {}
  const unsub = {
    expired: vi.fn(),
    renewError: vi.fn(),
    unloaded: vi.fn(),
    signedOut: vi.fn(),
    loaded: vi.fn(),
  }
  const events = {
    addAccessTokenExpired: (cb: Handler) => {
      handlers.expired = cb
      return unsub.expired
    },
    addSilentRenewError: (cb: Handler) => {
      handlers.renewError = cb
      return unsub.renewError
    },
    addUserUnloaded: (cb: Handler) => {
      handlers.unloaded = cb
      return unsub.unloaded
    },
    addUserSignedOut: (cb: Handler) => {
      handlers.signedOut = cb
      return unsub.signedOut
    },
    addUserLoaded: (cb: Handler) => {
      handlers.loaded = cb
      return unsub.loaded
    },
  }
  const auth = { events, signinSilent, isAuthenticated: true, user: null }
  return { auth, handlers, unsub }
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  initiateSignIn.mockReset()
  clearAccessTokenCookie.mockReset()
  authMock.mockReset()
})

describe('useRenewalWatchdog', () => {
  it('subscribes on mount and unsubscribes on unmount', () => {
    const { auth, unsub } = makeAuth(vi.fn().mockResolvedValue(null))
    authMock.mockReturnValue(auth)

    const { unmount } = renderHook(() => useRenewalWatchdog())
    unmount()

    expect(unsub.expired).toHaveBeenCalled()
    expect(unsub.renewError).toHaveBeenCalled()
    expect(unsub.unloaded).toHaveBeenCalled()
    expect(unsub.signedOut).toHaveBeenCalled()
    expect(unsub.loaded).toHaveBeenCalled()
  })

  it('renews on expiry and does not escalate on success', async () => {
    const signinSilent = vi.fn().mockResolvedValue({ expired: false })
    const { auth, handlers } = makeAuth(signinSilent)
    authMock.mockReturnValue(auth)

    renderHook(() => useRenewalWatchdog())
    handlers.expired?.()
    await flush()

    expect(signinSilent).toHaveBeenCalledTimes(1)
    expect(initiateSignIn).not.toHaveBeenCalled()
  })

  it('escalates after a failed renewal and does not double-escalate while cooling down', async () => {
    const signinSilent = vi.fn().mockRejectedValue(new Error('renew failed'))
    const { auth, handlers } = makeAuth(signinSilent)
    authMock.mockReturnValue(auth)

    renderHook(() => useRenewalWatchdog())

    handlers.renewError?.()
    await flush()
    expect(initiateSignIn).toHaveBeenCalledTimes(1)

    // Second event within the cooldown window: renew short-circuits and the
    // escalation is gated, so login is not triggered again.
    handlers.expired?.()
    await flush()
    expect(initiateSignIn).toHaveBeenCalledTimes(1)
  })

  it('allows escalation again after a userLoaded event resets the guard', async () => {
    const signinSilent = vi.fn().mockRejectedValue(new Error('renew failed'))
    const { auth, handlers } = makeAuth(signinSilent)
    authMock.mockReturnValue(auth)

    renderHook(() => useRenewalWatchdog())

    handlers.expired?.()
    await flush()
    expect(initiateSignIn).toHaveBeenCalledTimes(1)

    handlers.loaded?.() // session recovered → reset the escalation guard
    handlers.expired?.()
    await flush()
    expect(initiateSignIn).toHaveBeenCalledTimes(2)
  })

  it('clears the cookie on sign-out and user-unloaded', () => {
    const { auth, handlers } = makeAuth(vi.fn().mockResolvedValue(null))
    authMock.mockReturnValue(auth)

    renderHook(() => useRenewalWatchdog())

    handlers.unloaded?.()
    handlers.signedOut?.()
    expect(clearAccessTokenCookie).toHaveBeenCalledTimes(2)
  })

  it('coalesces concurrent renewals into a single signinSilent call', async () => {
    let resolveSilent: (value: unknown) => void = () => {}
    const signinSilent = vi.fn(
      () => new Promise((resolve) => (resolveSilent = resolve)),
    )
    const { auth, handlers } = makeAuth(signinSilent)
    authMock.mockReturnValue(auth)

    renderHook(() => useRenewalWatchdog())

    handlers.expired?.() // starts the renewal (signinSilent pending)
    handlers.renewError?.() // second trigger joins the in-flight renewal
    await flush()
    expect(signinSilent).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSilent({ expired: false })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(initiateSignIn).not.toHaveBeenCalled()
  })
})
