import { FolderInterface, FolderWithConversation } from '@/types/folder'

// export const saveFoldersInLocalStorage = (folders: FolderInterface[]) => {
//   localStorage.setItem('folders', JSON.stringify(folders))
// }

export async function fetchFolders(
  user_email: string,
): Promise<FolderWithConversation[]> {
  let fetchedFolders = []
  try {
    const foldersResonse = await fetch(`/api/folder?user_email=${user_email}`, {
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
  user_email: string,
) => {
  try {
    console.log('Saving conversation to server:', folder, user_email)
    const response = await fetch('/api/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder, email: user_email }),
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
) => {
  try {
    const response = await fetch('/api/folder', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deletedFolderId: folder.id }),
    })

    if (!response.ok) {
      throw new Error('Error deleting folder')
    }
  } catch (error) {
    console.error('Error deleting folder:', error)
  }
}
