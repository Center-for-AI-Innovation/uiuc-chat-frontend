/* @vitest-environment jsdom */

import { describe, expect, it, beforeEach } from 'vitest'
import clearLocalStorageOnce from '~/pages/api/UIUC-api/clearLocalStorage'

describe('clearLocalStorageOnce', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears localStorage once and sets the sentinel', () => {
    localStorage.setItem('a', '1')
    expect(localStorage.getItem('a')).toBe('1')

    clearLocalStorageOnce()
    expect(localStorage.getItem('a')).toBeNull()
    expect(localStorage.getItem('isLocalStorageCleared')).toBe('true')
  })

  it('does nothing when sentinel is already set', () => {
    localStorage.setItem('isLocalStorageCleared', 'true')
    localStorage.setItem('a', '1')

    clearLocalStorageOnce()
    expect(localStorage.getItem('a')).toBe('1')
  })
})

