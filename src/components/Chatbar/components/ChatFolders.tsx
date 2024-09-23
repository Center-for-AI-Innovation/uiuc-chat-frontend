import { useContext } from 'react'

import { FolderInterface, FolderWithConversation } from '@/types/folder'

import HomeContext from '~/pages/api/home/home.context'

import Folder from '@/components/Folder'

import { ConversationComponent } from './Conversation'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateConversation } from '~/hooks/conversationQueries'

interface Props {
  searchTerm: string
  currentEmail: string
  courseName: string
}

export const ChatFolders = ({
  searchTerm,
  currentEmail,
  courseName,
}: Props) => {
  const {
    state: { folders, conversations },
    handleUpdateConversation,
  } = useContext(HomeContext)
  const queryClient = useQueryClient()
  const updateConversationMutation = useUpdateConversation(
    currentEmail as string,
    queryClient,
    courseName,
  )

  const handleDrop = (e: any, folder: FolderInterface) => {
    console.log('drop triggered: ', e)
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'))
      handleUpdateConversation(conversation, {
        key: 'folderId',
        value: folder.id,
      })
      conversation.folderId = folder.id
      updateConversationMutation.mutate(conversation)
    }
  }

  const ChatFolders = (currentFolder: FolderWithConversation) => {
    // console.log('currentFolder: ', currentFolder)
    // console.log('conversations in current folder:', currentFolder.conversations)
    return (currentFolder.conversations || []).map((conversation, index) => {
      return (
        <div key={index} className="ml-5 gap-2 border-l pl-2">
          <ConversationComponent conversation={conversation} />
        </div>
      )
    })

    // return (
    //   conversations &&
    //   conversations
    //     .filter((conversation) => conversation.folderId)
    //     .map((conversation, index) => {
    //       if (conversation.folderId === currentFolder.id) {
    //         return (
    //           <div key={index} className="ml-5 gap-2 border-l pl-2">
    //             <ConversationComponent conversation={conversation} />
    //           </div>
    //         )
    //       }
    //     })
    // )
  }
  // console.log('folders: ', folders)
  return (
    <div className="flex w-full flex-col pt-2">
      {folders
        .filter((folder) => folder.type === 'chat')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder, index) => (
          <Folder
            key={index}
            searchTerm={searchTerm}
            currentFolder={folder}
            handleDrop={handleDrop}
            folderComponent={ChatFolders(folder)}
          />
        ))}
    </div>
  )
}
