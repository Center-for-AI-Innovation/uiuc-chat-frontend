import { useState, useEffect, useMemo } from 'react'
import { useDebouncedState } from '@mantine/hooks'
import {
  IconLock,
  IconLockOpen,
  IconCopy,
  IconCheck,
  IconUsers,
} from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import EmailListAccordion from './EmailListAccordion'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { motion, AnimatePresence } from 'framer-motion'
import { Accordion } from '@/components/shadcn/accordion'
import { useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/Tooltip'

// Props interface for the ShareSettingsModal component
interface ShareSettingsModalProps {
  opened: boolean // Controls modal visibility
  onClose: () => void // Handler for closing the modal
  projectName: string // Name of the current project
  metadata: CourseMetadata // Project metadata containing sharing settings
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
  const [isAccessMenuOpen, setIsAccessMenuOpen] = useState(false)

  type AccessLevel = 'invited' | 'logged_in' | 'public'

  const currentAccessLevel: AccessLevel = useMemo(() => {
    if (!isPrivate) return 'public'
    if (allowLoggedInUsers) return 'logged_in'
    return 'invited'
  }, [isPrivate, allowLoggedInUsers])

  const accessOptions = useMemo(
    () =>
      [
        {
          key: 'invited' as AccessLevel,
          label: 'Only invited members',
          description: 'Only explicitly invited collaborators can access',
          icon: <IconLock className="h-4 w-4" />,
        },
        {
          key: 'logged_in' as AccessLevel,
          label: 'All logged-in users',
          description: 'Any authenticated user in the org can access',
          icon: <IconUsers className="h-4 w-4" />,
        },
        // Public option will be conditionally included below
      ].concat(
        useIllinoisChatConfig
          ? []
          : [
              {
                key: 'public' as AccessLevel,
                label: 'Public (anyone with the link)',
                description: 'No login required to access',
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
    setIsAccessMenuOpen(false)
    await callSetCourseMetadata(projectName, updatedMetadata)
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
                    <p className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium`}>
                      {currentAccessLevel === 'invited' && 'Only invited members'}
                      {currentAccessLevel === 'logged_in' && 'All logged-in users'}
                      {currentAccessLevel === 'public' && 'Public (anyone with the link)'}
                    </p>
                    <p className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs`}>
                      {currentAccessLevel === 'invited' && 'Only explicitly invited collaborators can access'}
                      {currentAccessLevel === 'logged_in' && 'Any authenticated user in the org can access'}
                      {currentAccessLevel === 'public' && 'No login required to access'}
                    </p>
                  </div>
                </div>

                {/* Dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() => setIsAccessMenuOpen((v) => !v)}
                    className={`rounded-md border border-[--background-dark] bg-[--modal] px-3 py-2 text-sm transition-colors hover:bg-[--background-dark]`}
                  >
                    Change access
                  </button>

                  {isAccessMenuOpen && (
                    <TooltipProvider>
                      <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-md border border-[--background-dark] bg-[--modal] p-1 shadow-xl">
                        {accessOptions.map((opt) => (
                          <Tooltip key={opt.key}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleAccessSelect(opt.key)}
                                className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-[--background-dark]`}
                              >
                                <span className="flex items-center gap-2">
                                  {opt.icon}
                                  {opt.label}
                                </span>
                                {currentAccessLevel === opt.key && (
                                  <IconCheck size={16} className="text-[--foreground]" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{opt.description}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            {/* Members & Administrators sections */}
            <div className="space-y-3">
              <AnimatePresence>
                {isPrivate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Accordion
                      type="single"
                      defaultValue="members"
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
                )}
              </AnimatePresence>

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
