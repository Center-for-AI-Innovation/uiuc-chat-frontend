import { describe, expect, it, vi } from 'vitest'
import {
  deleteFolderFromServer,
  fetchFolders,
  saveFolderToServer,
} from '@/hooks/__internal__/folders'
import type { FolderWithConversation } from '~/types/folder'

const folder: FolderWithConversation = {
  id: 'folder-1',
  name: 'My Folder',
  type: 'chat',
  conversations: [],
}

describe('folder API helpers', () => {
  it('fetchFolders rejects on non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('oops', { status: 500 }),
    )

    await expect(fetchFolders('TEST101', 'user@example.com')).rejects.toThrow(
      'Error fetching folders',
    )
  })

  it('fetchFolders rejects when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(fetchFolders('TEST101', 'user@example.com')).rejects.toThrow(
      'boom',
    )
  })

  it('fetchFolders returns parsed folders on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([folder]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(fetchFolders('TEST101', 'user@example.com')).resolves.toEqual([
      folder,
    ])
  })

  it('saveFolderToServer posts folder payload', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 200 }))

    await saveFolderToServer(folder, 'TEST101', 'user@example.com')

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/folder',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('saveFolderToServer rejects when response is non-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('no', { status: 500, statusText: 'Nope' }),
    )

    await expect(
      saveFolderToServer(folder, 'TEST101', 'user@example.com'),
    ).rejects.toThrow('Nope')
  })

  it('deleteFolderFromServer sends delete payload', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 200 }))

    await deleteFolderFromServer(folder, 'TEST101', 'user@example.com')

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/folder',
      expect.objectContaining({
        method: 'DELETE',
      }),
    )
  })

  it('deleteFolderFromServer rejects when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(
      deleteFolderFromServer(folder, 'TEST101', 'user@example.com'),
    ).rejects.toThrow('boom')
  })

  it('deleteFolderFromServer rejects when response is non-ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('no', { status: 500 }),
    )

    await expect(
      deleteFolderFromServer(folder, 'TEST101', 'user@example.com'),
    ).rejects.toThrow('Error deleting folder')
  })
})
