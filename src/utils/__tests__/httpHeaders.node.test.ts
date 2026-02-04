/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import { createHeaders } from '../httpHeaders'

describe('createHeaders (node)', () => {
  it('does not attempt posthog fallback when window is undefined', () => {
    expect(createHeaders()).toEqual({
      'Content-Type': 'application/json',
    })
  })
})
