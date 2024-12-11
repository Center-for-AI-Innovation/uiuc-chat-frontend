import { useState, useEffect } from 'react'
import { useDebouncedState } from '@mantine/hooks'
import {
  IconLock,
  IconLockOpen,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import EmailListAccordion from './EmailListAccordion'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { motion, AnimatePresence } from 'framer-motion'
import { Accordion } from '@/components/shadcn/accordion'
import { useQueryClient } from '@tanstack/react-query'

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
  const shareUrl = `${window.location.origin}/${projectName}`
  const [isCopied, setIsCopied] = useState(false)

  const handlePrivacyChange = async () => {
    const newIsPrivate = !isPrivate
    const updatedMetadata = {
      ...metadata,
      is_private: newIsPrivate,
    }

    // Update local state immediately
    setMetadata(updatedMetadata)

    // Update cache immediately
    queryClient.setQueryData(['courseMetadata', projectName], updatedMetadata)

    // Make API call
    await callSetCourseMetadata(projectName, updatedMetadata)
  }

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
        className="relative mx-4 max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#15162c] shadow-2xl ring-1 ring-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-500/40 [&::-webkit-scrollbar-track]:bg-[#1e1f3a] [&::-webkit-scrollbar]:w-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Add subtle gradient border */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-transparent blur-xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex flex-col">
            <h2
              className={`${montserrat_heading.variable} font-montserratHeading text-xl font-semibold text-white`}
            >
              Share your chatbot
            </h2>
            <p
              className={`${montserrat_paragraph.variable} mt-1 font-montserratParagraph text-sm text-gray-400`}
            >
              Collaborate with members on this project
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-red-500"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full">
              ✕
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-white/10">
          {/* Chatbot Link section */}
          <div className="p-6">
            <h3
              className={`${montserrat_heading.variable} mb-3 font-montserratHeading text-sm font-medium text-gray-400`}
            >
              Chatbot Link
            </h3>
            <div className="relative flex gap-2">
              <div className="group relative flex-1">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={`${montserrat_paragraph.variable} w-full rounded-lg bg-[#1e1f3a]/80 px-4 py-2.5 font-montserratParagraph text-sm text-white/90 ring-1 ring-white/10 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50`}
                />
              </div>
              <button
                onClick={handleCopy}
                className="flex min-w-[42px] items-center justify-center rounded-lg bg-violet-600 p-2.5 text-white transition-all duration-300 hover:bg-violet-500 active:scale-95"
              >
                {isCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </button>
            </div>
          </div>

          {/* Access Control section */}
          <div className="space-y-4 p-6">
            <h3
              className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium text-gray-400`}
            >
              Access Control
            </h3>

            {/* Privacy toggle */}
            <div className="rounded-lg bg-[#1e1f3a] p-4 ring-1 ring-white/10 transition-all duration-300 hover:ring-violet-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPrivate ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15162c] ring-1 ring-white/10">
                      <IconLock className="h-5 w-5 text-violet-400" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15162c] ring-1 ring-white/10">
                      <IconLockOpen className="h-5 w-5 text-violet-400" />
                    </div>
                  )}
                  <div>
                    <p
                      className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium text-white`}
                    >
                      {isPrivate ? 'Private Project' : 'Public Project'}
                    </p>
                    <p
                      className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-gray-400`}
                    >
                      {isPrivate
                        ? 'Only specified people can access'
                        : 'Anyone with the link can access'}
                    </p>
                  </div>
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
                      className="w-full"
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
