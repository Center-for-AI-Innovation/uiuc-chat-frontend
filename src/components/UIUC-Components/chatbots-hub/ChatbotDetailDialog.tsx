import {
  Calendar,
  ChevronDown,
  Code2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  Headphones,
  Link2,
  MessageSquare,
  Presentation,
  Settings,
  Share2,
} from 'lucide-react'
import NextLink from 'next/link'
import { useMemo, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/shadcn/ui/avatar'
import { Button } from '~/components/shadcn/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/shadcn/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '~/components/shadcn/ui/dialog'
import { Separator } from '~/components/shadcn/ui/separator'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import { ChatbotAccessLevelBadge } from './ChatbotAccessLevelBadge'
import { ChatbotOrganizationBadge } from './ChatbotOrganizationBadge'
import { ChatbotUserRoleBadge } from './ChatbotUserRoleBadge'
import {
  type ChatbotCardData,
  type DocumentSummary,
  type DocumentTypeStat,
} from './chatbots.types'
import { useFetchMaintainerProfiles } from '~/hooks/queries/useFetchMaintainerProfiles'

type ChatbotDetailDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly card: ChatbotCardData
  readonly bannerUrl?: string
  readonly onShareClick: () => void
}

export function ChatbotDetailDialog({
  open,
  onOpenChange,
  card,
  onShareClick,
}: ChatbotDetailDialogProps) {
  const {
    course_name,
    title,
    description,
    organization,
    projectType,
    owner,
    accessLevel,
    isPrivate = true,
    metadata,
  } = card

  const auth = useAuth()
  const currentUserEmail = auth.user?.profile.email as string | undefined

  const organizationLabel = organization ?? projectType
  const resolvedAccessLevel = accessLevel ?? (isPrivate ? 'private' : undefined)
  const resolvedUserRole =
    card.userRole ?? (owner === 'You' ? 'owner' : 'member')

  const { data: fetchedMetadata } = useFetchCourseMetadata({
    courseName: course_name,
    enabled: open && !metadata,
  })
  const resolvedMetadata = metadata ?? fetchedMetadata

  const isOwnerOrAdmin =
    !!currentUserEmail &&
    !!resolvedMetadata &&
    (resolvedMetadata.course_owner === currentUserEmail ||
      (resolvedMetadata.course_admins ?? []).includes(currentUserEmail))

  const aboutText = resolvedMetadata?.project_description || description

  // TODO: Replace with useFetchDocumentSummary(course_name) when API exists
  const documentSummary: DocumentSummary | undefined = undefined

  const { data: maintainerProfiles = [] } =
    useFetchMaintainerProfiles(course_name)

  // TODO: Replace with real timestamps from API
  const createdAt = card.created_at
  const lastUpdatedAt = card.last_updated_at

  // TODO: Replace with useFetchUserLastAccess(course_name) when API exists
  const lastAccessedAt: string | undefined = undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden border-[#e5e7eb] bg-white p-0 text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#15172b] dark:text-white [&>*]:max-w-full">
        <DialogTitle className="sr-only">{title} Details</DialogTitle>

        {/* Scrollable body */}
        <div className="scrollbar-thin-auto min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header section */}
          <div className="space-y-3 px-6 pb-2 pt-6">
            <ChatbotUserRoleBadge role={resolvedUserRole} />

            <h2 className="text-2xl font-bold leading-tight">{title}</h2>

            <p className="text-sm leading-relaxed text-[--illinois-storm-dark] dark:text-[#94a3b8]">
              {description}
            </p>

            {/* Metadata row: created date + last access */}
            <div className="flex flex-wrap items-center gap-x-3 text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
              {createdAt && (
                <span>
                  Created {formatDate(createdAt)} by{' '}
                  {extractNameFromEmail(
                    resolvedMetadata?.course_owner ?? owner,
                  )}
                </span>
              )}
              {createdAt && lastAccessedAt && (
                <Separator
                  orientation="vertical"
                  className="h-3 dark:bg-[#32517a]"
                />
              )}
              {lastAccessedAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  My last access: {formatRelativeTime(lastAccessedAt)}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              {organizationLabel && (
                <ChatbotOrganizationBadge label={organizationLabel} />
              )}
              {resolvedAccessLevel && (
                <ChatbotAccessLevelBadge level={resolvedAccessLevel} />
              )}
            </div>
          </div>

          <Separator className="mx-6 my-3 dark:bg-[#32517a]" />

          {/* About This Chatbot */}
          {aboutText && (
            <div className="px-6 py-3">
              <h3 className="mb-2 text-base font-semibold">
                About this Chatbot
              </h3>
              <p className="text-sm leading-relaxed text-[--illinois-storm-dark] dark:text-[#94a3b8]">
                {aboutText}
              </p>
            </div>
          )}

          {/* Data in This Project */}
          <div className="px-6 py-3">
            <DocumentSummarySection summary={documentSummary} />
          </div>

          {/* Maintained By */}
          {maintainerProfiles && maintainerProfiles.length > 0 && (
            <div className="px-6 py-3">
              <h3 className="mb-3 text-base font-semibold">Maintained By</h3>
              <div className="space-y-3">
                {maintainerProfiles.map((m) => (
                  <div key={m.email} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {m.avatar_url && (
                        <AvatarImage src={m.avatar_url} alt={m.display_name} />
                      )}
                      <AvatarFallback className="bg-[#e5e7eb] text-sm font-medium text-[--illinois-blue] dark:bg-[#32517a] dark:text-white">
                        {getInitials(m.display_name ?? m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.display_name ?? extractNameFromEmail(m.email)}
                        {m.email === currentUserEmail && (
                          <span className="ml-1 text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                            (Me)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                        {m.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          {lastUpdatedAt && (
            <div className="px-6 pb-4 pt-2">
              <p className="flex items-center gap-1.5 text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                <Calendar className="h-3.5 w-3.5" />
                Project last updated {formatRelativeTime(lastUpdatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Fixed footer: Action Buttons */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#e5e7eb] px-6 py-4 dark:border-[#32517a]">
          <div className="flex min-w-0 items-center gap-2">
            {isOwnerOrAdmin && (
              <NextLink href={`/${course_name}/dashboard`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-1.5 whitespace-nowrap border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[--illinois-blue] hover:bg-[#f3f4f6] dark:border-[#32517a] dark:bg-[#13294b] dark:text-white dark:hover:bg-[#1a3a6b]"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  Admin Settings
                </Button>
              </NextLink>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 whitespace-nowrap border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[--illinois-blue] hover:bg-[#f3f4f6] dark:border-[#32517a] dark:bg-[#13294b] dark:text-white dark:hover:bg-[#1a3a6b]"
              onClick={() => {
                onOpenChange(false)
                onShareClick()
              }}
            >
              <Share2 className="h-4 w-4 shrink-0" />
              Share
            </Button>
          </div>

          <NextLink href={`/${course_name}/chat`}>
            <Button
              size="sm"
              className="h-10 gap-1.5 whitespace-nowrap bg-[--illinois-blue] px-6 text-sm font-medium text-white hover:bg-[--foreground-dark] dark:bg-[#1d4ed8] dark:hover:bg-[#2563eb]"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              Start Chatting
            </Button>
          </NextLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Document Summary (expandable)
// ---------------------------------------------------------------------------

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'Websites-crawled': <Link2 className="h-4 w-4 text-[#6366f1]" />,
  Video: <FileVideo className="h-4 w-4 text-[#8b5cf6]" />,
  PDF: <FileText className="h-4 w-4 text-[#ef4444]" />,
  PowerPoint: <Presentation className="h-4 w-4 text-[#f97316]" />,
  Images: <FileImage className="h-4 w-4 text-[#ec4899]" />,
  'Text Files': <FileType className="h-4 w-4 text-[#3b82f6]" />,
  'Word Documents': <FileText className="h-4 w-4 text-[#2563eb]" />,
  Audio: <Headphones className="h-4 w-4 text-[#d946ef]" />,
  Excel: <FileSpreadsheet className="h-4 w-4 text-[#22c55e]" />,
  Code: <Code2 className="h-4 w-4 text-[#14b8a6]" />,
}

function DocumentSummarySection({
  summary,
}: {
  readonly summary: DocumentSummary | undefined
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!summary) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] p-4 dark:border-[#32517a]">
        <h3 className="mb-3 text-base font-semibold">Data in This Project</h3>
        <p className="text-sm text-[--illinois-storm-medium] dark:text-[#94a3b8]">
          No document data available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] dark:border-[#32517a] dark:bg-[#0f1629]">
      <h3 className="px-4 pt-4 text-base font-semibold">
        Data in This Project
      </h3>
      <Separator className="mx-4 my-3 dark:bg-[#32517a]" />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e5e7eb] dark:bg-[#1e293b]">
              <FileText className="h-5 w-5 text-[--illinois-storm-medium] dark:text-[#94a3b8]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Document Summary</p>
              <p className="text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                Overview of all files in this project
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {summary.total_file_count} files
              </p>
              <p className="text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                {formatBytes(summary.total_size_bytes)}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[--illinois-storm-medium] transition-transform duration-200 dark:text-[#94a3b8] ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-1 px-4 pb-4">
            {summary.by_type.map((stat) => (
              <DocumentTypeRow key={stat.type} stat={stat} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function DocumentTypeRow({ stat }: { readonly stat: DocumentTypeStat }) {
  const icon = FILE_TYPE_ICONS[stat.type] ?? (
    <FileText className="h-4 w-4 text-[--illinois-storm-medium]" />
  )
  const countLabel =
    stat.type === 'Websites-crawled'
      ? `${stat.file_count} ${stat.file_count === 1 ? 'page' : 'pages'}`
      : `${stat.file_count} ${stat.file_count === 1 ? 'file' : 'files'}`

  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b]">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{stat.type}</span>
      </div>
      <div className="flex items-center gap-4 text-right text-sm text-[--illinois-storm-medium] dark:text-[#94a3b8]">
        <span>{countLabel}</span>
        <span className="w-16 text-right">
          {formatBytes(stat.total_size_bytes)}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitials(name: string): string {
  return name
    .split(/[\s._@-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    const months = Math.floor(days / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  } catch {
    return dateStr
  }
}
