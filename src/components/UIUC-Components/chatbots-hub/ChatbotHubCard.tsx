import { useQuery } from '@tanstack/react-query'
import { Bot, Info, Settings, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Card, CardContent } from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { ChatbotAccessLevelBadge } from './ChatbotAccessLevelBadge'
import { ChatbotDetailDialog } from './ChatbotDetailDialog'
import { ChatbotUserRoleBadge } from './ChatbotUserRoleBadge'
import { type ChatbotCardData } from './chatbots.types'
import { ChatbotOrganizationBadge } from './ChatbotOrganizationBadge'
import ShareSettingsModal from '../ShareSettingsModal'

export function ChatbotHubCard(card: ChatbotCardData) {
  const {
    course_name,
    title,
    description,
    organization,
    projectType,
    owner,
    collaboratorCount,
    userRole,
    accessLevel,
    isPrivate = true,
    bannerImageS3,
    metadata,
  } = card

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const resolvedAccessLevel = accessLevel ?? (isPrivate ? 'private' : undefined)
  const resolvedUserRole = userRole ?? (owner === 'You' ? 'owner' : 'member')
  const isOwnerCard = resolvedUserRole === 'owner'

  const { data: bannerUrl } = useQuery({
    queryKey: ['bannerUrl', course_name, bannerImageS3],
    enabled: Boolean(course_name) && Boolean(bannerImageS3),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams({
        s3_path: bannerImageS3 as string,
        course_name: course_name,
      })
      const res = await fetch(`/api/UIUC-api/getPresignedUrl?${params}`)
      if (!res.ok) throw new Error('Failed to fetch banner URL')
      const json = await res.json()
      return json.presignedUrl as string
    },
  })

  return (
    <>
      <Card
        className={`group relative flex min-h-[380px] w-full flex-col overflow-hidden rounded-[14px] bg-white transition-transform duration-200 ease-out hover:scale-[1.03] dark:bg-[#13294b] [&:has(a:focus-visible)]:ring-2 [&:has(a:focus-visible)]:ring-[--illinois-orange] [&:has(a:focus-visible)]:ring-offset-2 ${
          isOwnerCard
            ? 'border border-[--illinois-orange-branding] dark:border-[#32517a]'
            : 'border border-[#e5e7eb] shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-[#32517a] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
        }`}
      >
        <div className="relative flex h-40 shrink-0 items-start justify-between p-3">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8edf4] via-[#f0ebe4] to-[#dde5ed] dark:from-[#1a3a6b] dark:via-[#152e55] dark:to-[#0f2340]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/55 dark:from-transparent dark:via-[#13294b]/45 dark:to-[#13294b]/95" />

          {/* Info icon — visible on hover or keyboard focus */}
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 h-9 w-9 rounded-full bg-white/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-white/80 focus-visible:opacity-100 group-hover:opacity-100 dark:bg-[#0c1f3f]/60 dark:hover:bg-[#0c1f3f]/80"
            aria-label={`Details for ${title}`}
            onClick={() => setIsDetailOpen(true)}
          >
            <Info className="h-5 w-5 text-[--illinois-blue] dark:text-white" />
          </Button>

          <ChatbotUserRoleBadge
            role={resolvedUserRole}
            className="relative z-10"
          />
        </div>

        <CardContent className="flex flex-1 flex-col px-5 pb-4 pt-5">
          <div className="space-y-4">
            <h3 className="truncate text-xl font-semibold leading-7 text-[--illinois-blue] dark:text-white">
              <Link
                href={`/${course_name}/chat`}
                aria-label={`Open chat for ${title}`}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:!outline-none"
              >
                {title}
              </Link>
            </h3>
            <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-[--illinois-storm-dark] dark:text-[#c8d2e3]">
              {description}
            </p>
            <div className="flex flex-col gap-2">
              {(organization || projectType) && (
                <div className="flex flex-wrap items-center gap-2">
                  {organization && (
                    <ChatbotOrganizationBadge label={organization} />
                  )}
                  {projectType && (
                    <ChatbotOrganizationBadge label={projectType} />
                  )}
                </div>
              )}
              {resolvedAccessLevel && (
                <div className="flex items-center">
                  <ChatbotAccessLevelBadge level={resolvedAccessLevel} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto">
            <Separator className="my-3 dark:bg-[#32517a]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Bot className="h-4 w-4 text-[--illinois-storm-medium] dark:text-[#94a3b8]" />
                <span className="text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                  by
                </span>
                <span className="truncate text-[--illinois-storm-dark] dark:text-[#c8d2e3]">
                  {owner}
                </span>
                {collaboratorCount > 0 && (
                  <span className="text-[--illinois-storm-medium] dark:text-[#94a3b8]">
                    +{collaboratorCount} more
                  </span>
                )}
              </div>
              {metadata && (
                <div className="relative z-10 flex items-center gap-1">
                  {isOwnerCard && (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={`Settings for ${title}`}
                    >
                      <Link href={`/${course_name}/dashboard`}>
                        <Settings className="h-4 w-4 text-[--illinois-blue] dark:text-white" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={`Share ${title}`}
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4 text-[--illinois-blue] dark:text-white" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChatbotDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        card={card}
        bannerUrl={bannerUrl}
        onShareClick={() => setIsShareModalOpen(true)}
      />

      {metadata && (
        <ShareSettingsModal
          opened={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          projectName={course_name}
          metadata={metadata}
        />
      )}
    </>
  )
}
