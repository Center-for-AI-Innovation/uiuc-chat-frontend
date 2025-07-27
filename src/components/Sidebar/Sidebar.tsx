import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch, Text } from '@mantine/core'

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton'

import Search from '../Search'
import { FolderWithConversation } from '~/types/folder'

interface Props<T> {
  isOpen: boolean
  addItemButtonTitle: string
  side: 'left' | 'right'
  items: T[]
  itemComponent: ReactNode
  folderComponent: ReactNode
  folders: FolderWithConversation[]
  footerComponent?: ReactNode
  searchTerm: string
  handleSearchTerm: (searchTerm: string) => void
  toggleOpen: () => void
  handleCreateItem: () => void
  handleCreateFolder: () => void
  handleDrop: (e: any) => void
  onScroll: (e: any) => void
  customGPTsComponent?: ReactNode
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  folders,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
  onScroll,
  customGPTsComponent,
}: Props<T>) => {
  const { t } = useTranslation('promptbar')

  const allowDrop = (e: any) => {
    e.preventDefault()
  }

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541'
  }

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none'
  }

  return isOpen ? (
    <div>
      <div
        className={`fixed top-0 ${side}-0 z-40 flex h-full w-[260px] flex-none flex-col space-y-2  bg-[#131426] p-2 text-[14px] transition-all sm:relative sm:top-0`}
      >
        <div className="flex items-center">
          <button
            className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={() => {
              handleCreateItem()
              handleSearchTerm('')
              setTimeout(() => {
                const chatInput = document.querySelector('textarea.chat-input') as HTMLTextAreaElement;
                if (chatInput) {
                  chatInput.focus();
                }
              }, 100);
            }}
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={handleCreateFolder}
          >
            <IconFolderPlus size={16} />
          </button>
        </div>
        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />
        
        {/* Custom GPTs Component - Display below search and above folders */}
        {customGPTsComponent}
        
        <div className="flex-grow overflow-auto" onScroll={onScroll}>
          {folders?.length > 0 && (
            <div className="mt-4 border-t border-white/20 pt-4">
              <Text size="sm" color="dimmed" className="mb-2 px-3">
                Folders
              </Text>
                {folderComponent}
            </div>
          )}

          {items?.length > 0 ? (
            <div className="mt-4 border-t border-white/20 pt-4">
              <Text size="sm" color="dimmed" className="mb-2 px-3">
                Conversations
              </Text>
              <div
                className="pt-2"
                onDrop={handleDrop}
                onDragOver={allowDrop}
                onDragEnter={highlightDrop}
                onDragLeave={removeHighlight}
              >
                {itemComponent}
              </div>
            </div>
          ) : (
            <div className="mt-8 select-none text-center text-white opacity-50">
              <IconMistOff className="mx-auto mb-3" />
              <span className="text-[14px] leading-normal">
                {t('No data.')}
              </span>
            </div>
          )}
        </div>
        {footerComponent}
      </div>

      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  )
}

export default Sidebar
