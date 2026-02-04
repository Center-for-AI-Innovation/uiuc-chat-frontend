import { describe, expect, it, vi } from 'vitest'
import {
  deleteFolderFromServer,
  fetchFolders,
  saveFolderToServer,
} from '../folders'
import type { FolderWithConversation } from '~/types/folder'

const folder: FolderWithConversation = {
  id: 'folder-1',
  name: 'My Folder',
  type: 'chat',
  conversations: [],
}

describe('folder API helpers', () => {
  it('fetchFolders returns [] on non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('oops', { status: 500 }),
    )

    await expect(fetchFolders('TEST101', 'user@example.com')).resolves.toEqual(
      [],
    )
  })

  it('fetchFolders returns [] when fetch throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(fetchFolders('TEST101', 'user@example.com')).resolves.toEqual(
      [],
    )
    expect(errSpy).toHaveBeenCalled()
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

  it('saveFolderToServer logs errors when response is non-ok', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('no', { status: 500, statusText: 'Nope' }),
    )

    await expect(
      saveFolderToServer(folder, 'TEST101', 'user@example.com'),
    ).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
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

  it('deleteFolderFromServer logs errors when fetch throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('boom'))

    await expect(
      deleteFolderFromServer(folder, 'TEST101', 'user@example.com'),
    ).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
  })

  it('deleteFolderFromServer logs errors when response is non-ok', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('no', { status: 500 }),
    )

    await expect(
      deleteFolderFromServer(folder, 'TEST101', 'user@example.com'),
    ).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
  })
})
