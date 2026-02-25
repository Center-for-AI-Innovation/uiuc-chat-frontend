import { describe, expect, it } from 'vitest'
import {
  createFileKey,
  isImageFile,
  removeDuplicateFiles,
  truncateFileName,
} from '../fileUploadUtils'

describe('fileUploadUtils', () => {
  it('creates deterministic file keys and removes duplicates', () => {
    const a = new File(['a'], 'notes.txt', { type: 'text/plain' })
    const b = new File(['b'], 'notes.txt', { type: 'text/plain' })
    const c = new File(['c'], 'image.png', { type: 'image/png' })

    expect(createFileKey(a)).toBe('notes.txt-text/plain')
    expect(removeDuplicateFiles([a, b, c]).map((f) => f.name)).toEqual([
      'notes.txt',
      'image.png',
    ])
  })

  it('detects image files by MIME type or extension', () => {
    const mimeImage = new File(['x'], 'doc.bin', { type: 'image/webp' })
    const extImage = new File(['x'], 'photo.JPG', { type: 'application/octet' })
    const nonImage = new File(['x'], 'notes.md', { type: 'text/markdown' })

    expect(isImageFile(mimeImage)).toBe(true)
    expect(isImageFile(extImage)).toBe(true)
    expect(isImageFile(nonImage)).toBe(false)
  })

  it('truncates long names and handles files without extensions', () => {
    expect(truncateFileName('short.txt')).toBe('short.txt')
    expect(truncateFileName('averyveryverylongfilename.pdf', 12)).toBe(
      'averyvery....pdf',
    )
    expect(truncateFileName('veryverylongfilename', 10)).toBe(
      '....veryverylongfilename',
    )
  })
})
