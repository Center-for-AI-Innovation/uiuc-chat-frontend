import { useEffect, useState } from 'react'

/**
 * Returns a value that lags `value` by `delay` milliseconds. Useful for
 * gating expensive effects (network requests, heavy computations) behind
 * a user pause in typing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(handle)
  }, [value, delay])

  return debounced
}
