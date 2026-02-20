import { type FolderWithConversation } from '@/types/folder'
import { createHeaders } from '~/utils/httpHeaders'

// removed local createHeaders; use shared from ~/utils/httpHeaders

export async function fetchFolders(
  course_name: string,
  userEmail?: string,
): Promise<FolderWithConversation[]> {
  const response = await fetch(`/api/folder?courseName=${course_name}`, {
    method: 'GET',
    headers: createHeaders(userEmail),
  })

  if (!response.ok) {
    let errorMessage = 'Error fetching folders'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }

  const fetchedFolders = (await response.json()) as FolderWithConversation[]
  return fetchedFolders
}

export const saveFolderToServer = async (
  folder: FolderWithConversation,
  course_name: string,
  userEmail?: string,
) => {
  const response = await fetch('/api/folder', {
    method: 'POST',
    headers: createHeaders(userEmail),
    body: JSON.stringify({ folder, courseName: course_name }),
  })

  if (!response.ok) {
    let errorMessage = 'Error saving folder'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }
}

export const deleteFolderFromServer = async (
  folder: FolderWithConversation,
  course_name: string,
  userEmail?: string,
) => {
  const response = await fetch('/api/folder', {
    method: 'DELETE',
    headers: createHeaders(userEmail),
    body: JSON.stringify({
      deletedFolderId: folder.id,
      courseName: course_name,
    }),
  })

  if (!response.ok) {
    let errorMessage = 'Error deleting folder'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }
}
