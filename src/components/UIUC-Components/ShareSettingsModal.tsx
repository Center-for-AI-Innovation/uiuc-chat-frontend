import { useState, useEffect } from 'react'
import {
  IconCheck,
  IconCopy,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import EmailChipsComponent from './EmailChipsComponent'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Accordion, Title } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'

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
  metadata,
}: ShareSettingsModalProps) {
  // Add a state to track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true)

  // Update isInitialMount when modal opens/closes
  useEffect(() => {
    if (!opened) setIsInitialMount(true)
    else {
      // Small delay to ensure modal is visible first
      const timer = setTimeout(() => setIsInitialMount(false), 100)
      return () => clearTimeout(timer)
    }
  }, [opened])

  // State management
  const [isPrivate, setIsPrivate] = useState(metadata?.is_private || false)
  const [courseAdmins, setCourseAdmins] = useState<string[]>([])
  const shareUrl = `${window.location.origin}/${projectName}`
  const [isCopied, setIsCopied] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  /**
   * Toggles project privacy setting and updates metadata
   */
  const handlePrivacyChange = async () => {
    const newIsPrivate = !isPrivate
    setIsPrivate(newIsPrivate)

    if (metadata) {
      metadata.is_private = newIsPrivate
      await callSetCourseMetadata(projectName, metadata)
    }
  }

  /**
   * Updates course metadata when email addresses are changed
   */
  const handleEmailAddressesChange = async (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => {
    const response = await callSetCourseMetadata(
      course_name,
      new_course_metadata,
    )
    if (!response) console.error('Error updating course metadata')
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#15162c] p-6 shadow-2xl ring-1 ring-white/10"
      >
        {/* Header with improved gradient and spacing */}
        <div className="mb-4 flex items-center justify-between">
          <Title
            className={`${montserrat_heading.variable} font-montserratHeading text-2xl font-semibold tracking-tight`}
            variant="gradient"
            gradient={{ from: '#E5E7EB', to: 'white', deg: 170 }}
            order={3}
          >
            Share your chatbot
          </Title>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Subtle divider */}
        {/* <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent" /> */}

        {/* Share URL section */}
        <div className="mb-6 rounded-lg bg-gray-900/50 p-4 ring-1 ring-white/5">
          <Title
            className={`${montserrat_heading.variable} mb-3 font-montserratHeading text-sm font-medium text-gray-300`}
            order={4}
          >
            Chatbot Link
          </Title>
          <div className="relative flex gap-2">
            <div className="group relative flex-1">
              <div className="animate-spin-slow absolute -inset-0.5 rounded-lg bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-violet-600/20 opacity-75 blur transition duration-1000 group-hover:opacity-100" />
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="relative w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white/90 ring-1 ring-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <button
              onClick={handleCopy}
              className="relative flex min-w-[42px] items-center justify-center rounded-lg bg-violet-600 p-2.5 text-white transition-all duration-300 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/30 active:scale-95"
            >
              {isCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </button>
          </div>
        </div>

        {/* Access Control section with improved spacing and transitions */}
        <div>
          <Title
            className={`${montserrat_heading.variable} mb-3 font-montserratHeading text-sm font-medium text-gray-300`}
            order={4}
          >
            Access Control
          </Title>
          <div className="rounded-lg bg-gray-900/50 p-4 ring-1 ring-white/5">
            {/* Privacy toggle with improved animation */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPrivate ? (
                  <IconLock className="text-white/90" size={20} />
                ) : (
                  <IconLockOpen className="text-white/90" size={20} />
                )}
                <span className="text-sm font-medium text-white/90">
                  {isPrivate ? 'Private Project' : 'Public Project'}
                </span>
              </div>
              <button
                onClick={handlePrivacyChange}
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                  isPrivate ? 'bg-violet-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Members section */}
            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  initial={isInitialMount ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="mb-4 space-y-2"
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-200">
                      Members
                    </h4>
                    <details
                      className="group"
                      open={isDetailsOpen}
                      onToggle={(e) =>
                        setIsDetailsOpen((e.target as HTMLDetailsElement).open)
                      }
                    >
                      <summary className="mb-4 cursor-pointer space-y-2 text-xs text-gray-400">
                        Only these email addresses are able to access the
                        content.
                      </summary>
                      <motion.div
                        initial={false}
                        animate={{
                          height: isDetailsOpen ? 'auto' : 0,
                          y: isDetailsOpen ? 0 : -20,
                        }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 space-y-2"
                      >
                        <EmailChipsComponent
                          course_owner={metadata.course_owner as string}
                          course_admins={courseAdmins}
                          course_name={projectName}
                          is_private={isPrivate}
                          onEmailAddressesChange={handleEmailAddressesChange}
                          course_intro_message={
                            metadata.course_intro_message || ''
                          }
                          banner_image_s3={metadata.banner_image_s3 || ''}
                          openai_api_key={metadata.openai_api_key as string}
                          is_for_admins={false}
                        />
                      </motion.div>
                    </details>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle divider */}
            {/* <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent" /> */}

            {/* Administrators section - Tightened spacing */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-200">
                Administrators
              </h4>
              <p className="text-xs text-gray-400">
                Admins have full edit permissions.
              </p>
              <div className="mt-2">
                <EmailChipsComponent
                  course_owner={metadata.course_owner as string}
                  course_admins={courseAdmins}
                  course_name={projectName}
                  is_private={isPrivate}
                  onEmailAddressesChange={handleEmailAddressesChange}
                  course_intro_message={metadata.course_intro_message || ''}
                  banner_image_s3={metadata.banner_image_s3 || ''}
                  openai_api_key={metadata.openai_api_key as string}
                  is_for_admins={true}
                />
              </div>
            </div>

            {/* Subtle divider */}
            {/* <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent" /> */}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
