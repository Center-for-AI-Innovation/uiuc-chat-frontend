import {
  IconEdit,
  IconFolderPlus,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMistOff,
} from '@tabler/icons-react'
import { type ReactNode } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { IconSettings } from '@tabler/icons-react'

import { type FolderWithConversation } from '~/types/folder'
import Search from '../Search'
import { Button, Tooltip } from '@mantine/core'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useAuth } from 'react-oidc-context'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'

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
  courseName?: string | undefined
  courseMetadata?: CourseMetadata | null
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
  courseName,
  courseMetadata,
}: Props<T>) => {
  const { t } = useTranslation('promptbar')
  const nextRouter = useRouter()
  const auth = useAuth()
  const permission = courseMetadata
    ? get_user_permission(courseMetadata, auth)
    : 'no_permission'
  const { data: presignedBannerUrl } = useQuery({
    queryKey: ['bannerUrl', courseName, courseMetadata?.banner_image_s3],
    enabled:
      Boolean(courseName && courseName !== 'chat') &&
      Boolean(courseMetadata?.banner_image_s3),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams({
        s3_path: courseMetadata?.banner_image_s3 as string,
        course_name: courseName as string,
      })
      const res = await fetch(`/api/UIUC-api/getPresignedUrl?${params}`)
      if (!res.ok) throw new Error('Failed to fetch banner URL')
      const json = await res.json()
      return json.presignedUrl as string
    },
  })
  const imageSrc =
    courseName === 'chat'
      ? '/media/logo_illinois.png'
      : presignedBannerUrl || null

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
        className={`relative ${side}-0 z-40 flex h-full w-[300px] flex-none flex-col space-y-2 border-r border-[--dashboard-border] bg-[--sidebar-background] p-2 text-[14px] shadow-xl transition-all sm:relative sm:top-0 md:w-[340px] md:p-3 lg:w-[360px] xl:w-[390px]`}
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

        <Tooltip
          label="Admin Dashboard"
          disabled={permission !== 'edit'}
          withArrow
          position="right"
          withinPortal
        >
          <div
            className={`flex items-center justify-start gap-3 rounded-lg bg-[--sidebar-background] p-2 text-[--foreground] transition-colors md:gap-4 md:p-3 ${permission === 'edit' ? 'cursor-pointer hover:bg-[--navbar-hover-background]' : 'cursor-default'}`}
            role={permission === 'edit' ? 'button' : undefined}
            tabIndex={permission === 'edit' ? 0 : -1}
            onClick={
              permission === 'edit'
                ? () => {
                    if (courseName) {
                      void nextRouter.push(`/${courseName}/dashboard`)
                    }
                  }
                : undefined
            }
            onKeyDown={
              permission === 'edit'
                ? (e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && courseName) {
                      e.preventDefault()
                      void nextRouter.push(`/${courseName}/dashboard`)
                    }
                  }
                : undefined
            }
          >
            {/* Banner/logo (if present) */}
            <div className="h-14 w-14 shrink-0 md:h-16 md:w-16">
              <div className="relative h-full w-full overflow-hidden rounded-sm">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={
                      courseName === 'chat' ? 'Illinois logo' : 'Course banner'
                    }
                    fill
                    sizes="(max-width: 768px) 56px, 64px"
                    className="object-contain"
                    priority={false}
                  />
                ) : null}
              </div>
            </div>

            <div className="min-w-0 grow">
              {/* Name */}
              <div className="line-clamp-3 max-w-full break-words text-[15px] font-bold leading-[125%] md:text-[16px]">
                {courseName === 'chat'
                  ? 'Illinois flagship chatbot'
                  : (() => {
                      const normalized = (courseName || '').replace(/-/g, ' ')
                      return normalized
                        .split(/\s+/)
                        .map((word) =>
                          word.length === 0
                            ? ''
                            : word.match(/^[A-Z0-9]+$/)
                              ? word // keep acronym casing
                              : word.charAt(0).toUpperCase() +
                                word.slice(1).toLowerCase(),
                        )
                        .join(' ')
                    })()}
              </div>
              {/* Description */}
              <div className="mt-1 line-clamp-2 max-w-full overflow-hidden text-[13.5px] leading-[145%] text-[--foreground-faded] md:text-[15px]">
                {courseMetadata?.project_description || ''}
              </div>
            </div>

            {permission === 'edit' ? (
              <div className="h-5 w-5 shrink-0">
                <Button
                  className="h-auto w-auto bg-transparent p-0 text-[--foreground] hover:bg-transparent hover:text-[--dashboard-button]"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (courseName) {
                      void nextRouter.push(`/${courseName}/dashboard`)
                    }
                  }}
                  title="Admin Dashboard"
                  aria-label="Admin Dashboard"
                >
                  <IconSettings stroke={1.5} size={20} />
                </Button>
              </div>
            ) : null}
          </div>
        </Tooltip>

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
