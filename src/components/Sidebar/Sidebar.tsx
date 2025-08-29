import {
  IconEdit,
  IconFolderPlus,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMistOff,
  IconPlus,
} from '@tabler/icons-react'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { IconSettings } from '@tabler/icons-react'
import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton'

import { type FolderWithConversation } from '~/types/folder'
import Search from '../Search'
import { Button } from '@mantine/core'
import { courseNames } from '~/db/schema'

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
    <div className="relative h-full">
      <div
        className={`relative ${side}-0 z-40 flex h-full w-[260px] flex-none flex-col space-y-2 border-r border-[--dashboard-border] bg-[--sidebar-background] p-2 text-[14px] shadow-xl transition-all sm:relative sm:top-0`}
      >
        <div className="flex items-center gap-2">
          <div className="grow">
            <button
              className="flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md p-1 text-sm text-[--foreground] 
              transition-colors duration-200
              hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground]"
              onClick={toggleOpen}
            >
              <IconLayoutSidebarLeftCollapse size={20} stroke={1.5} />
            </button>
          </div>

          <button
            className="flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md p-1 text-sm text-[--foreground] 
            transition-colors duration-200
            hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground]"
            onClick={handleCreateFolder}
          >
            <IconFolderPlus size={20} stroke={1.5} />
          </button>

          <button
            className="flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md p-1 text-sm text-[--foreground] 
            transition-colors duration-200
            hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground]"
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
            <IconEdit size={20} stroke={1.5} />
          </button>
        </div>

        <div
          className="flex items-start justify-start gap-1 bg-[--sidebar-background] py-2 text-[--foreground]"
          onClick={() => {
            //TODO: add router push to dashboard
            //            if (courseName) router.push(`/${courseName}/dashboard`)
          }}
        >
          {/* TODO: change from hard coded logo to variables. also, hide this entire div when there is no logo */}
          <div className="h-5 w-5 shrink-0">
            <div className="flex h-full w-full items-center justify-center">
              {/* insert logo here */}#
            </div>
          </div>

          <div className="grow">
            {/* TODO: change from hard coded to variables */}
            <div className="font-bold leading-[125%]">
              Illinois Flagship (courseName)
            </div>
            <div className="mt-1 text-xs leading-[125%] text-[--foreground-faded]">
              The U of I Flagship chatbot. (description)
            </div>
          </div>

          <div className="h-5 w-5 shrink-0">
            <Button className="h-auto w-auto bg-transparent p-0 text-[--foreground] hover:bg-transparent hover:text-[--dashboard-button]">
              <IconSettings stroke={1.5} size={20} />
            </Button>
          </div>
        </div>

        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />
        <div className="flex-grow overflow-auto" onScroll={onScroll}>
          {folders?.length > 0 && (
            <div className="flex border-b border-[--dashboard-border] pb-2">
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

      {/* TODO: eventually update the open/close sidebar button component so both sides work... for now, changing just for this sidebar */}
      {/*      <CloseSidebarButton onClick={toggleOpen} side={side} /> */}
    </div>
  ) : (
    <div className="relative">
      <div className="absolute left-2 top-2 z-[150]">
        <button
          className="flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md p-1 text-sm text-[--foreground] 
          transition-colors duration-200
          hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground]"
          onClick={toggleOpen}
        >
          <IconLayoutSidebarLeftExpand size={20} stroke={1.5} />
        </button>
      </div>

      {/* TODO: eventually update the open/close sidebar button component so both sides work... for now, changing just for this sidebar */}
      {/*      <OpenSidebarButton onClick={toggleOpen} side={side} /> */}
    </div>
  )
}

export default Sidebar
