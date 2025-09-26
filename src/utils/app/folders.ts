import { type FolderWithConversation } from '@/types/folder'


export async function fetchFolders(
  course_name: string,
): Promise<FolderWithConversation[]> {
  let fetchedFolders = []
  try {
    const foldersResonse = await fetch(`/api/folder?courseName=${course_name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!foldersResonse.ok) {
      throw new Error('Error fetching folders')
    }
    fetchedFolders = await foldersResonse.json()
    // console.log('fetched folders ', fetchedFolders)
  } catch (error) {
    console.error('Error fetching folders:', error)
  }
  return fetchedFolders
  // dispatch({ field: 'folders', value: fetchedFolders })
}

export const saveFolderToServer = async (
  folder: FolderWithConversation,
  course_name: string,
) => {
  try {
    console.log('Saving conversation to server:', folder)
    const response = await fetch('/api/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder, courseName: course_name }),
    })

    if (!response.ok) {
      throw new Error(`Error saving folder: ` + response.statusText)
    }
  } catch (error) {
    console.error('Error saving folder:', error)
  }
}

export const deleteFolderFromServer = async (
  folder: FolderWithConversation,
  course_name: string,
) => {
  try {
    const response = await fetch('/api/folder', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deletedFolderId: folder.id, courseName: course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting folder')
    }
  } catch (error) {
    console.error('Error deleting folder:', error)
  }
}
