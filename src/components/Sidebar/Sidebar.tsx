import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton'

import { type FolderWithConversation } from '~/types/folder'
import Search from '../Search'

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
    <div className="relative">
      <div
        className={`absolute top-0 ${side}-0 z-40 flex h-full w-[260px] flex-none flex-col space-y-2 border-r border-[--dashboard-border] bg-[--sidebar-background] p-2 text-[14px] shadow-xl transition-all sm:relative sm:top-0`}
      >
        <div className="flex items-center">
          <button
            className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-[--button-border] p-3 text-[--foreground] 
            transition-colors duration-200
            hover:border-[--button-hover] hover:bg-[--button-hover] hover:text-[--button-text-color]"
            onClick={() => {
              handleCreateItem()
              handleSearchTerm('')
              setTimeout(() => {
                const chatInput = document.querySelector(
                  'textarea.chat-input',
                ) as HTMLTextAreaElement
                if (chatInput) {
                  chatInput.focus()
                }
              }, 100)
            }}
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md border border-[--button-border] p-3 text-sm text-[--foreground] 
            transition-colors duration-200
            hover:border-[--button-hover] hover:bg-[--button-hover] hover:text-[--button-text-color]"
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
        <div className="flex-grow overflow-auto" onScroll={onScroll}>
          {folders?.length > 0 && (
            <div className="flex border-b border-[--foreground-faded] pb-2">
              {folderComponent}
            </div>
          )}

          {items?.length > 0 ? (
            <div
              className="pt-2"
              onDrop={handleDrop}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
              // onScroll={onScroll}
            >
              {itemComponent}
            </div>
          ) : (
            <div className="mt-8 select-none text-center text-[--foreground] opacity-50">
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
    <div className="relative">
      <OpenSidebarButton onClick={toggleOpen} side={side} />
    </div>
  )
}

export default Sidebar
