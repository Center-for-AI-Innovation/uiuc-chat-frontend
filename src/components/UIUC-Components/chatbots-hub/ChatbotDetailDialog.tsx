import {
  Bot,
  Calendar,
  FileText,
  FolderOpen,
  Settings,
  Share2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { useAuth } from 'react-oidc-context'
import { Badge } from '~/components/shadcn/ui/badge'
import { Button } from '~/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '~/components/shadcn/ui/dialog'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import { useFetchDocumentGroups } from '~/hooks/queries/useFetchDocumentGroups'
import { ChatbotAccessLevelBadge } from './ChatbotAccessLevelBadge'
import { ChatbotOrganizationBadge } from './ChatbotOrganizationBadge'
import { ChatbotUserRoleBadge } from './ChatbotUserRoleBadge'
import { type ChatbotCardData, type KnowledgeSource } from './chatbots.types'

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
  bannerUrl,
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
    knowledgeSources,
  } = card

  const auth = useAuth()
  const currentUserEmail = auth.user?.profile.email as string | undefined

  const organizationLabel = organization ?? projectType
  const resolvedAccessLevel = accessLevel ?? (isPrivate ? 'private' : undefined)
  const resolvedUserRole =
    card.userRole ?? (owner === 'You' ? 'owner' : 'member')

  // Lazily fetch metadata when it's not already on the card (e.g. accessible chatbots)
  const { data: fetchedMetadata } = useFetchCourseMetadata({
    courseName: course_name,
    enabled: open && !metadata,
  })
  const resolvedMetadata = metadata ?? fetchedMetadata

  // Show Admin Settings if the current user is the owner or an admin
  const isOwnerOrAdmin =
    !!currentUserEmail &&
    !!resolvedMetadata &&
    (resolvedMetadata.course_owner === currentUserEmail ||
      (resolvedMetadata.course_admins ?? []).includes(currentUserEmail))

  // Fetch document groups (for real chatbots that don't have inline knowledgeSources)
  const { data: documentGroups } = useFetchDocumentGroups(course_name)

  // Prefer inline knowledgeSources, fall back to fetched document groups
  const resolvedSources: KnowledgeSource[] = useMemo(() => {
    if (knowledgeSources && knowledgeSources.length > 0) {
      return knowledgeSources
    }
    if (documentGroups && documentGroups.length > 0) {
      return documentGroups.map((g) => ({
        name: g.name,
        doc_count: g.doc_count,
      }))
    }
    return []
  }, [knowledgeSources, documentGroups])

  // Build maintainers list from metadata
  const maintainers = buildMaintainersList(
    resolvedMetadata?.course_owner,
    resolvedMetadata?.course_admins,
  )

  // About text: prefer project_description, fall back to card description
  const aboutText = resolvedMetadata?.project_description || description

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden border-[#e5e7eb] bg-white p-0 text-[--illinois-blue] dark:border-[#32517a] dark:bg-[#0c1f3f] dark:text-white">
        <DialogTitle className="sr-only">{title} Details</DialogTitle>

        {/* Fixed header: Banner + Title + Badges */}
        <div className="shrink-0">
          {/* Banner */}
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#e8edf4] via-[#f0ebe4] to-[#dde5ed] dark:from-[#1a3a6b] dark:via-[#152e55] dark:to-[#0f2340]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 dark:to-[#0c1f3f]/80" />
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              <ChatbotUserRoleBadge role={resolvedUserRole} />
              {isOwnerOrAdmin && (
                <Link href={`/${course_name}/dashboard`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full border border-[#32517a] bg-[#13294b] text-white hover:bg-[#1a3a6b] hover:text-white"
                  >
                    <Settings className="mr-1.5 h-4 w-4" />
                    Admin Settings
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Title, description, badges */}
          <div className="space-y-3 px-6 pb-4 pt-5">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm leading-relaxed text-[--illinois-storm-dark] dark:text-[#94a3b8]">
              {description}
            </p>
            <div className="flex items-center gap-3">
              {organizationLabel && (
                <ChatbotOrganizationBadge label={organizationLabel} />
              )}
              {resolvedAccessLevel && (
                <ChatbotAccessLevelBadge level={resolvedAccessLevel} />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable detail sections */}
        <div className="scrollbar-thin-auto min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-2">
          {/* About This Chatbot */}
          {aboutText && (
            <DetailSection icon={<FileText />} title="About This Chatbot">
              <p className="text-sm leading-relaxed text-[--illinois-storm-dark] dark:text-[#94a3b8]">
                {aboutText}
              </p>
            </DetailSection>
          )}

          {/* Maintained By */}
          {maintainers.length > 0 && (
            <DetailSection icon={<Users />} title="Maintained By">
              <div className="flex flex-wrap gap-2">
                {maintainers.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="border-[#e5e7eb] bg-[#f3f4f6] text-[--illinois-storm-dark] hover:bg-[#e5e7eb] dark:border-[#32517a] dark:bg-[#13294b] dark:text-[#c8d2e3] dark:hover:bg-[#1a3a6b]"
                  >
                    <Bot className="mr-1.5 h-3 w-3" />
                    {m}
                  </Badge>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Last Updated */}
          <DetailSection icon={<Calendar />} title="Last Updated">
            <p className="text-sm text-[--illinois-storm-dark] dark:text-[#94a3b8]">
              Recently
            </p>
          </DetailSection>

          {/* Knowledge Sources */}
          {resolvedSources.length > 0 && (
            <DetailSection icon={<FolderOpen />} title="Knowledge Sources">
              <div className="space-y-2">
                {resolvedSources.map((source) => (
                  <div
                    key={source.name}
                    className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 dark:border-[#32517a] dark:bg-[#13294b]/50"
                  >
                    <p className="text-sm font-medium text-[--illinois-blue] dark:text-[#c8d2e3]">
                      {source.name}
                    </p>
                    {source.description && (
                      <p className="mt-0.5 text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                        {source.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                      {source.doc_count} document
                      {source.doc_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>

        {/* Fixed footer: Action Buttons */}
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-[#e5e7eb] px-6 py-4 dark:border-[#32517a]">
          <Link href={`/${course_name}/chat`}>
            <Button
              variant="outline"
              className="h-10 border-[#e5e7eb] bg-white px-8 text-sm font-medium text-[--illinois-blue] hover:bg-[#f3f4f6] hover:text-[--illinois-blue] dark:border-[#32517a] dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-[#e5e7eb] dark:hover:text-[--illinois-blue]"
            >
              Start Chatting
            </Button>
          </Link>
          <Button
            className="h-10 bg-[--illinois-blue] px-8 text-sm font-medium text-white hover:bg-[--foreground-dark] dark:bg-[#13294b] dark:text-white dark:hover:bg-[#1a3a6b]"
            onClick={() => {
              onOpenChange(false)
              onShareClick()
            }}
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailSection({
  icon,
  title,
  children,
}: {
  readonly icon: React.ReactNode
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] p-4 dark:border-[#32517a]">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[--illinois-storm-medium] dark:text-[#94a3b8] [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/** Deduplicates owner + admins into a single maintainers list */
function buildMaintainersList(
  courseOwner: string | undefined,
  courseAdmins: string[] | undefined,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  if (courseOwner) {
    seen.add(courseOwner)
    result.push(courseOwner)
  }

  if (courseAdmins) {
    for (const admin of courseAdmins) {
      if (!seen.has(admin)) {
        seen.add(admin)
        result.push(admin)
      }
    }
  }

  return result
}
