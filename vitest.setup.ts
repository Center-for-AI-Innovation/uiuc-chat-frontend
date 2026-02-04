import React from 'react'
import { webcrypto } from 'node:crypto'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { server } from './src/test-utils/server'

type TestRouterOverrides = Partial<{
  push: (...args: any[]) => any
  replace: (...args: any[]) => any
  prefetch: (...args: any[]) => any
  back: (...args: any[]) => any
  forward: (...args: any[]) => any
  refresh: (...args: any[]) => any
  query: Record<string, any>
  pathname: string
  asPath: string
  isReady: boolean
}>

type TestAuthOverrides = Partial<{
  isLoading: boolean
  isAuthenticated: boolean
  user: any
  error: any
}>

declare global {
  // eslint-disable-next-line no-var
  var __TEST_ROUTER__: TestRouterOverrides | undefined
  // eslint-disable-next-line no-var
  var __TEST_AUTH__: TestAuthOverrides | undefined
  // eslint-disable-next-line no-var
  var __TEST_PATHNAME__: string | undefined
  // eslint-disable-next-line no-var
  var __TEST_SEARCH_PARAMS__: URLSearchParams | undefined
}

// Ensure WebCrypto is available for utilities that use crypto.subtle.
if (!globalThis.crypto) {
  ;(globalThis as unknown as { crypto: Crypto }).crypto = webcrypto as Crypto
}

// Normalize relative fetch URLs (e.g. "/api/..." or "../api/...") so Node's fetch accepts them.
const nativeFetch = globalThis.fetch
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') {
    return nativeFetch(new URL(input, 'http://localhost'), init)
  }
  return nativeFetch(input, init)
}

// JSDOM misses a few browser APIs used by UI libs (e.g. next-themes).
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      media: query,
      matches: false,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
  window.scrollTo = vi.fn()

  // Some UI components copy text to clipboard.
  if (!('clipboard' in navigator)) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      configurable: true,
    })
  } else if (!(navigator as any).clipboard?.writeText) {
    ;(navigator as any).clipboard = {
      writeText: vi.fn(() => Promise.resolve()),
    }
  } else {
    ;(navigator as any).clipboard.writeText = vi.fn(() => Promise.resolve())
  }
}

// JSDOM doesn't implement Element.scrollTo; several components (chat auto-scroll) call it directly.
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
  if (!('scrollTo' in HTMLElement.prototype)) {
    ;(HTMLElement.prototype as any).scrollTo = vi.fn()
  }
  if (!('scrollIntoView' in HTMLElement.prototype)) {
    ;(HTMLElement.prototype as any).scrollIntoView = vi.fn()
  }
}

// Mantine uses ResizeObserver in various components (SegmentedControl, charts, etc.).
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { ResizeObserver: any }).ResizeObserver =
    ResizeObserver as any
}

// Some components use IntersectionObserver for visibility/scroll tracking.
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserver {
    constructor(_callback: any, _options?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  ;(
    globalThis as unknown as { IntersectionObserver: any }
  ).IntersectionObserver = IntersectionObserver as any
}

// JSDOM doesn't implement URL.createObjectURL/revokeObjectURL by default.
if (typeof URL !== 'undefined') {
  if (!('createObjectURL' in URL)) {
    ;(
      URL as unknown as { createObjectURL: (obj: any) => string }
    ).createObjectURL = vi.fn(() => 'blob:mock')
  }
  if (!('revokeObjectURL' in URL)) {
    ;(
      URL as unknown as { revokeObjectURL: (url: string) => void }
    ).revokeObjectURL = vi.fn()
  }
}

// JSDOM's CSS/selector engine can throw on certain selectors emitted by UI libs / CSS tooling
// (e.g. `:scope` or escaped Tailwind variants). Browsers ignore these safely; tests shouldn't crash.
if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  const nativeQuerySelector = Element.prototype.querySelector
  const nativeQuerySelectorAll = Element.prototype.querySelectorAll

  Element.prototype.querySelector = function (selectors: string) {
    try {
      return nativeQuerySelector.call(this, selectors)
    } catch (err: any) {
      if (err?.name === 'SyntaxError') return null
      throw err
    }
  }

  Element.prototype.querySelectorAll = function (selectors: string) {
    try {
      return nativeQuerySelectorAll.call(this, selectors)
    } catch (err: any) {
      if (err?.name === 'SyntaxError')
        return document.createDocumentFragment().childNodes
      throw err
    }
  }
}

// Common Next.js runtime mocks used across components.
const defaultTestRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  query: {} as Record<string, any>,
  pathname: '/',
  asPath: '/',
  isReady: true,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}

vi.mock('next/router', () => ({
  useRouter: () => {
    const overrides = globalThis.__TEST_ROUTER__ ?? {}
    return {
      ...defaultTestRouter,
      ...overrides,
      query: { ...defaultTestRouter.query, ...(overrides.query ?? {}) },
    }
  },
  default: defaultTestRouter,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (globalThis.__TEST_ROUTER__?.push as any) ?? vi.fn(),
    replace: (globalThis.__TEST_ROUTER__?.replace as any) ?? vi.fn(),
    prefetch: (globalThis.__TEST_ROUTER__?.prefetch as any) ?? vi.fn(),
  }),
  usePathname: () => globalThis.__TEST_PATHNAME__ ?? '/',
  useSearchParams: () =>
    globalThis.__TEST_SEARCH_PARAMS__ ?? new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  default: (props: any) =>
    React.createElement('img', {
      ...props,
      src: typeof props?.src === 'string' ? props.src : props?.src?.src,
    }),
}))

vi.mock('next/link', () => ({
  default: (props: any) =>
    React.createElement(
      'a',
      { href: props.href, className: props.className, onClick: props.onClick },
      props.children,
    ),
}))

vi.mock('next/font/google', () => {
  const makeFont = () => ({
    className: 'font-mock',
    variable: '--font-mock',
    style: {},
  })
  return {
    Montserrat: makeFont,
    Courier_Prime: makeFont,
  }
})

vi.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    ...(globalThis.__TEST_AUTH__ ?? {}),
  }),
}))

vi.mock('posthog-js', () => ({
  default: {
    get_distinct_id: () => 'test-posthog-id',
    capture: vi.fn(),
  },
}))

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    identify: vi.fn(),
    capture: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
  globalThis.__TEST_ROUTER__ = undefined
  globalThis.__TEST_AUTH__ = undefined
  globalThis.__TEST_PATHNAME__ = undefined
  globalThis.__TEST_SEARCH_PARAMS__ = undefined
})
afterAll(() => server.close())
