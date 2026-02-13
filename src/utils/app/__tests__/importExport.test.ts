import { describe, expect, it, vi } from 'vitest'
import {
  exportData,
  isExportFormatV1,
  isExportFormatV2,
  isExportFormatV3,
  isExportFormatV4,
} from '../importExport'

describe('importExport format guards', () => {
  it('detects v1 (array)', () => {
    expect(isExportFormatV1([])).toBe(true)
    expect(isExportFormatV1({})).toBe(false)
  })

  it('detects v2 (folders + history without version)', () => {
    expect(isExportFormatV2({ folders: [], history: [] })).toBe(true)
    expect(isExportFormatV2({ version: 4, folders: [], history: [] })).toBe(
      false,
    )
  })

  it('detects v3/v4 by version', () => {
    expect(isExportFormatV3({ version: 3 })).toBe(true)
    expect(isExportFormatV4({ version: 4 })).toBe(true)
  })
})

describe('exportData', () => {
  it('creates a downloadable json file from localStorage', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-02-03T12:00:00Z'))

    localStorage.setItem('conversationHistory', JSON.stringify([{ id: 'c1' }]))
    localStorage.setItem('folders', JSON.stringify([{ id: 'f1' }]))
    localStorage.setItem('prompts', JSON.stringify([{ id: 'p1' }]))

    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock')
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})

    const originalCreateElement = document.createElement.bind(document)
    const link = originalCreateElement('a')
    const click = vi.spyOn(link, 'click').mockImplementation(() => {})
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const removeChild = vi.spyOn(document.body, 'removeChild')
    vi.spyOn(document, 'createElement').mockReturnValue(link)

    exportData()

    expect(createObjectURL).toHaveBeenCalled()
    expect(appendChild).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(removeChild).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

    vi.useRealTimers()
  })
})
