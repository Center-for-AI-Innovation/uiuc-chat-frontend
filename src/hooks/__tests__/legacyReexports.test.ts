import { describe, expect, it } from 'vitest'
import * as folderQueries from '../folderQueries'
import * as messageQueries from '../messageQueries'

describe('legacy re-export shims', () => {
  it('exports expected legacy hook names', () => {
    expect(typeof folderQueries.useCreateFolder).toBe('function')
    expect(typeof folderQueries.useDeleteFolder).toBe('function')
    expect(typeof folderQueries.useUpdateFolder).toBe('function')
    expect(typeof messageQueries.useDeleteMessages).toBe('function')
  })
})
