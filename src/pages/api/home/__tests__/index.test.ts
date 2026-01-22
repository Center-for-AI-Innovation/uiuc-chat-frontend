import { describe, expect, it } from 'vitest'
import home from '../index'

describe('pages/api/home/index', () => {
  it('re-exports Home component', () => {
    expect(home).toBeTruthy()
  })
})

