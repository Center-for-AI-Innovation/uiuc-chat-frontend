import React, { useState, useEffect, useMemo } from 'react'
import {
  IconLock,
  IconLockOpen,
  IconCopy,
  IconCheck,
  IconUsers,
  IconChevronDown,
} from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import EmailListAccordion from './EmailListAccordion'
import { useSetCourseMetadata } from '@/hooks/queries/useSetCourseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { motion } from 'framer-motion'
import { Accordion } from '@/components/shadcn/accordion'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/shadcn/ui/dropdown-menu'

// Props interface for the ShareSettingsModal component
interface ShareSettingsModalProps {
  opened: boolean // Controls modal visibility
  onClose: () => void // Handler for closing the modal
  projectName: string // Name of the current project
  metadata: CourseMetadata // Project metadata containing sharing settings
}

type AccessLevel = 'invited' | 'logged_in' | 'public'

// Access level labels and descriptions constants
const ACCESS_LABELS: Record<AccessLevel, string> = {
  invited: 'Private (only invited members)',
  logged_in: 'All logged-in users',
  public: 'Public (anyone with the link)',
}

const ACCESS_DESCRIPTIONS: Record<AccessLevel, string> = {
  invited: 'Only explicitly invited collaborators can access',
  logged_in: 'Any authenticated user can access',
  public: 'No login required to access',
}

/**
 * ShareSettingsModal Component
 *
 * A modal dialog that allows users to manage project sharing settings including:
 * - Toggle between public/private access
 * - Share project URL
 * - Manage member access (for private projects)
 * - Manage administrator permissions
 */
export default function ShareSettingsModal({
  opened,
  onClose,
  projectName,
  metadata: initialMetadata,
}: ShareSettingsModalProps) {
  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  const queryClient = useQueryClient()
  const { mutateAsync: setCourseMetadataAsync } =
    useSetCourseMetadata(projectName)
  const [metadata, setMetadata] = useState<CourseMetadata>(initialMetadata)

  // Only update from props when modal is opened
  useEffect(() => {
    if (opened) {
      setMetadata(initialMetadata)
    }
  }, [opened, initialMetadata])

  // Rest of the modal state
  const isPrivate = metadata?.is_private || false
  const allowLoggedInUsers = metadata?.allow_logged_in_users || false
  const shareUrl = `${window.location.origin}/${projectName}`
  const [isCopied, setIsCopied] = useState(false)

  const currentAccessLevel: AccessLevel = useMemo(() => {
    if (!isPrivate) return 'public'
    if (allowLoggedInUsers) return 'logged_in'
    return 'invited'
  }, [isPrivate, allowLoggedInUsers])

  // Use a ref to track previous access level without causing re-renders
  const prevAccessLevelRef = React.useRef<AccessLevel | null>(null)
  const transitionKeyRef = React.useRef(0)
  const isAnimatingRef = React.useRef(false)

  // Check if we're transitioning from non-invited to invited
  const isTransitioningToInvited = React.useMemo(() => {
    const prev = prevAccessLevelRef.current

    // First render - no animation
    if (prev === null) {
      prevAccessLevelRef.current = currentAccessLevel
      return false
    }

    // Transitioning from non-invited to invited
    if (
      prev !== 'invited' &&
      currentAccessLevel === 'invited' &&
      !isAnimatingRef.current
    ) {
      transitionKeyRef.current += 1 // Force remount with new key
      isAnimatingRef.current = true
      // Reset animation flag after animation duration
      setTimeout(() => {
        isAnimatingRef.current = false
      }, 300)
      prevAccessLevelRef.current = currentAccessLevel
      return true
    }

    prevAccessLevelRef.current = currentAccessLevel
    return isAnimatingRef.current
  }, [currentAccessLevel])

  const accessOptions = useMemo(
    () =>
      [
        {
          key: 'invited' as AccessLevel,
          label: ACCESS_LABELS.invited,
          description: ACCESS_DESCRIPTIONS.invited,
          icon: <IconLock className="h-4 w-4" />,
        },
        {
          key: 'logged_in' as AccessLevel,
          label: ACCESS_LABELS.logged_in,
          description: ACCESS_DESCRIPTIONS.logged_in,
          icon: <IconUsers className="h-4 w-4" />,
        },
        // Public option will be conditionally included below
      ].concat(
        useIllinoisChatConfig
          ? []
          : [
              {
                key: 'public' as AccessLevel,
                label: ACCESS_LABELS.public,
                description: ACCESS_DESCRIPTIONS.public,
                icon: <IconLockOpen className="h-4 w-4" />,
              },
            ],
      ),
    [useIllinoisChatConfig],
  )

  const handleAccessSelect = async (level: AccessLevel) => {
    const updatedMetadata: CourseMetadata = {
      ...metadata,
      ...(level === 'public'
        ? { is_private: false, allow_logged_in_users: false }
        : level === 'logged_in'
          ? { is_private: true, allow_logged_in_users: true }
          : { is_private: true, allow_logged_in_users: false }),
    }

    setMetadata(updatedMetadata)
    queryClient.setQueryData(['courseMetadata', projectName], updatedMetadata)
    await setCourseMetadataAsync(updatedMetadata)
  }

  // Removed old toggle handlers in favor of unified dropdown access control

  const handleEmailAddressesChange = (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => {
    // Update local state immediately
    setMetadata(new_course_metadata)

    // Update cache immediately
    queryClient.setQueryData(
      ['courseMetadata', course_name],
      new_course_metadata,
    )
  }

  // See handleAccessSelect for unified access updates

  /**
   * Handles copying the share URL to clipboard
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Don't render if modal is not opened
  if (!opened) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative mx-4 max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[--modal] text-[--modal-text] shadow-2xl ring-1 ring-white/10"
        style={{ scrollbarGutter: 'stable' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add subtle gradient border */}
        <div className="blur-xlxl absolute inset-0 -z-10 rounded-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--modal-border] px-6 py-4">
          <div className="flex flex-col">
            <h2
              className={`${montserrat_heading.variable} font-montserratHeading text-xl font-semibold`}
            >
              Share your chatbot
            </h2>
            <p
              className={`${montserrat_paragraph.variable} mt-1 font-montserratParagraph text-sm text-[--foreground-faded]`}
            >
              Collaborate with members on this project
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2  transition-colors hover:bg-[--background-faded]"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full">
              ✕
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="">
          {/* Chatbot Link section */}
          <div className="p-6 pb-0">
            <h3
              className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium`}
            >
              Chatbot Link
            </h3>

            <div className="relative mt-2 flex gap-2">
              <div className="group relative flex-1">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={`${montserrat_paragraph.variable} w-full rounded-lg bg-[--background-faded] px-4 py-2.5 font-montserratParagraph text-sm text-[--foreground] ring-1 ring-[--background-dark] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[--illinois-orange]`}
                />
              </div>
              <button
                onClick={handleCopy}
                aria-label="Copy share link"
                className="flex min-w-[42px] items-center justify-center rounded-lg bg-[--dashboard-button] p-2.5 text-[--dashboard-button-foreground] transition-all duration-300 hover:bg-[--dashboard-button-hover] active:scale-95"
              >
                {isCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </button>
            </div>
          </div>

          {/* Access Control section */}
          <div className="space-y-2 p-6">
            <h3
              className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium`}
            >
              Access Control
            </h3>

            {/* Unified Access dropdown */}
            <div className="rounded-lg bg-[--background-faded] p-4 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[--modal]">
                    {currentAccessLevel === 'invited' && (
                      <IconLock className="h-5 w-5 text-[--foreground-faded]" />
                    )}
                    {currentAccessLevel === 'logged_in' && (
                      <IconUsers className="h-5 w-5 text-[--foreground-faded]" />
                    )}
                    {currentAccessLevel === 'public' && (
                      <IconLockOpen className="h-5 w-5 text-[--foreground-faded]" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium`}
                    >
                      {ACCESS_LABELS[currentAccessLevel]}
                    </p>
                    <p
                      className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs`}
                    >
                      {ACCESS_DESCRIPTIONS[currentAccessLevel]}
                    </p>
                  </div>
                </div>

                {/* Dropdown trigger */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg border border-[--background-dark] bg-[--modal] px-3 py-2 text-sm transition-colors hover:bg-[--background-dark]">
                      <span className="hidden sm:inline">Change access</span>
                      <span className="sm:hidden">Access</span>
                      <IconChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 w-72 rounded-lg border-[--background-dark] bg-[--modal] p-1.5 text-[--foreground] sm:w-80"
                    style={{
                      animationDuration: '100ms',
                      willChange: 'transform, opacity',
                    }}
                  >
                    <DropdownMenuRadioGroup
                      value={currentAccessLevel}
                      onValueChange={(value) =>
                        handleAccessSelect(value as AccessLevel)
                      }
                    >
                      {accessOptions.map((opt) => (
                        <DropdownMenuRadioItem
                          key={opt.key}
                          value={opt.key}
                          className="my-1 cursor-pointer gap-3 rounded-md !pl-2 !pr-2 hover:rounded-md hover:bg-[--background-dark] focus:rounded-md focus:bg-[--background-dark] focus:text-[--foreground] [&>span:first-child]:hidden"
                        >
                          {opt.icon}
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-[--foreground-faded]">
                              {opt.description}
                            </span>
                          </div>
                          <DropdownMenuShortcut className="ml-auto">
                            {currentAccessLevel === opt.key && (
                              <IconCheck size={16} className="h-4 w-4" />
                            )}
                          </DropdownMenuShortcut>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Members & Administrators sections */}
            <div className="space-y-3">
              <motion.div
                animate={{
                  opacity: currentAccessLevel === 'invited' ? 1 : 0.5,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                {currentAccessLevel === 'invited' ? (
                  <motion.div
                    key={`members-transition-${transitionKeyRef.current}`}
                    initial={
                      isTransitioningToInvited ? { opacity: 0, y: -10 } : false
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <Accordion
                      type="single"
                      defaultValue={
                        isTransitioningToInvited ? undefined : 'members'
                      }
                      className="w-full bg-[--dashboard-background]"
                    >
                      <EmailListAccordion
                        course_name={projectName}
                        metadata={metadata}
                        is_private={isPrivate}
                        onEmailAddressesChange={handleEmailAddressesChange}
                        is_for_admins={false}
                      />
                    </Accordion>
                  </motion.div>
                ) : (
                  <div className="pointer-events-none w-full rounded-lg bg-[--background-faded]">
                    <Accordion type="single" className="w-full" value="">
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[--modal]">
                            <IconUsers className="h-5 w-5 text-[--foreground-faded]" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span
                              className={`${montserrat_heading.variable} font-montserratHeading text-sm`}
                            >
                              Members
                            </span>
                            <span
                              className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-[--foreground-faded]`}
                            >
                              {currentAccessLevel === 'logged_in'
                                ? 'Member management is only available for private chatbots'
                                : 'Member management is only available for private chatbots'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Accordion>
                  </div>
                )}
              </motion.div>

              <Accordion type="single" defaultValue="admins" className="w-full">
                <EmailListAccordion
                  course_name={projectName}
                  metadata={metadata}
                  is_private={isPrivate}
                  onEmailAddressesChange={handleEmailAddressesChange}
                  is_for_admins={true}
                />
              </Accordion>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
