import { describe, expect, it } from 'vitest'
import { programmingLanguages } from '../codeblock'

describe('programmingLanguages', () => {
  it('maps common languages to file extensions', () => {
    expect(programmingLanguages.javascript).toBe('.js')
    expect(programmingLanguages.typescript).toBe('.ts')
    expect(programmingLanguages['c++']).toBe('.cpp')
    expect(programmingLanguages.sql).toBe('.sql')
  })
})
