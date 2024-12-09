import { IconUser, IconUsers, IconAt, IconX } from '@tabler/icons-react'
import React, {
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/shadcn/accordion'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { superAdmins } from '~/pages/api/UIUC-api/upsertCourseMetadata'
import { useQueryClient } from '@tanstack/react-query'

function EmailInput({
  value,
  error,
  onKeyDown,
  onChange,
  onPaste,
}: {
  value: string
  error: string | null
  onKeyDown: (evt: KeyboardEvent<HTMLInputElement>) => void
  onChange: (evt: ChangeEvent<HTMLInputElement>) => void
  onPaste: (evt: React.ClipboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <IconAt className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Add people by email"
        className={`${montserrat_paragraph.variable} w-full rounded-lg bg-[#1e1f3d]/50 px-10 py-2.5 font-montserratParagraph text-sm text-gray-200 placeholder-gray-500 ring-1 ring-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500`}
        value={value}
        onKeyDown={onKeyDown}
        onChange={onChange}
        onPaste={onPaste}
      />
      {error && (
        <p
          className={`${montserrat_paragraph.variable} mt-1 font-montserratParagraph text-sm text-red-400`}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function EmailListItem({
  email,
  onDelete,
  course_owner,
  course_admins,
}: {
  email: string
  onDelete: () => void
  course_owner: string
  course_admins: string[]
}) {
  const isAdmin = email === course_owner || course_admins.includes(email)

  return (
    <div className="group flex items-center justify-between rounded-lg bg-[#1e1f3d]/50 px-4 py-3 ring-1 ring-white/10 transition-all duration-300 hover:ring-violet-500/50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24253c] ring-1 ring-white/10">
          {isAdmin ? (
            <IconUsers className="h-5 w-5 text-violet-400" />
          ) : (
            <IconUser className="h-5 w-5 text-violet-400" />
          )}
        </div>
        <div className="flex flex-col">
          <span
            className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm text-gray-200`}
          >
            {email}
          </span>
          <span
            className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-gray-400`}
          >
            Can {isAdmin ? 'manage' : 'view'}
          </span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="rounded-full p-1.5 opacity-0 transition-all duration-300 hover:bg-red-500/10 group-hover:opacity-100"
      >
        <IconX className="h-4 w-4 text-gray-400 transition-colors hover:text-red-500" />
      </button>
    </div>
  )
}

function EmailListAccordion({
  course_name,
  metadata,
  is_private,
  onEmailAddressesChange,
  is_for_admins,
}: {
  course_name: string
  metadata: CourseMetadata
  is_private: boolean
  onEmailAddressesChange?: (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => void
  is_for_admins: boolean
}) {
  const queryClient = useQueryClient()
  const emailAddresses = metadata.approved_emails_list || []
  const courseAdmins = metadata.course_admins || []
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDelete = async (email_address: string) => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      let updatedMetadata: CourseMetadata

      if (is_for_admins) {
        const updatedCourseAdmins = courseAdmins.filter(
          (admin) => admin !== email_address && !superAdmins.includes(admin),
        )
        const finalAdmins = [
          ...new Set([...updatedCourseAdmins, ...superAdmins]),
        ]

        updatedMetadata = {
          ...metadata,
          course_admins: finalAdmins,
        }
      } else {
        const updatedEmailAddresses = emailAddresses.filter(
          (email) => email !== email_address,
        )

        updatedMetadata = {
          ...metadata,
          approved_emails_list: updatedEmailAddresses,
        }
      }

      // Update cache immediately
      queryClient.setQueryData(['courseMetadata', course_name], updatedMetadata)

      // Update parent state
      if (onEmailAddressesChange) {
        onEmailAddressesChange(updatedMetadata, course_name)
      }

      // Make API call
      await callSetCourseMetadata(course_name, updatedMetadata)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = async (evt: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()
      const trimmedValue = value.trim()

      if (trimmedValue && isValid(trimmedValue)) {
        let updatedMetadata: CourseMetadata

        if (is_for_admins) {
          const updatedCourseAdmins = [...courseAdmins, trimmedValue]
          const finalAdmins = [
            ...new Set([...updatedCourseAdmins, ...superAdmins]),
          ]

          updatedMetadata = {
            ...metadata,
            course_admins: finalAdmins,
          }
        } else {
          const updatedEmailAddresses = [...emailAddresses, trimmedValue]

          updatedMetadata = {
            ...metadata,
            approved_emails_list: updatedEmailAddresses,
          }
        }

        // Update cache immediately
        queryClient.setQueryData(
          ['courseMetadata', course_name],
          updatedMetadata,
        )

        // Update parent state
        if (onEmailAddressesChange) {
          onEmailAddressesChange(updatedMetadata, course_name)
        }

        // Make API call
        await callSetCourseMetadata(course_name, updatedMetadata)
        setValue('')
      }
    }
  }

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setValue(evt.target.value)
    setError(null)
  }

  const handlePaste = async (evt: React.ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault()
    const paste = evt.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      const toBeAdded = emails.filter((email: string) => !isInList(email))
      if (is_for_admins) {
        const updatedCourseAdmins = [...courseAdmins, ...toBeAdded]
        const finalAdmins = [
          ...new Set([...updatedCourseAdmins, ...superAdmins]),
        ]

        const updatedMetadata = {
          ...metadata,
          course_admins: finalAdmins,
        }

        const response = await callSetCourseMetadata(
          course_name,
          updatedMetadata,
        )
        if (response && onEmailAddressesChange) {
          onEmailAddressesChange(updatedMetadata, course_name)
        }
      } else {
        const updatedEmailAddresses = [...emailAddresses, ...toBeAdded]

        const updatedMetadata = {
          ...metadata,
          approved_emails_list: updatedEmailAddresses,
        }

        const response = await callSetCourseMetadata(
          course_name,
          updatedMetadata,
        )
        if (response && onEmailAddressesChange) {
          onEmailAddressesChange(updatedMetadata, course_name)
        }
      }
    }
  }

  const isValid = (email: string) => {
    let localError = null

    if (isInList(email)) {
      localError = `${email} has already been added.`
    }

    if (!isEmail(email)) {
      localError = `${email} is not a valid email address.`
    }

    if (localError) {
      setError(localError)
      return false
    }

    return true
  }

  const isInList = (item: string) => {
    return emailAddresses.includes(item)
  }

  const isEmail = (email: string) => {
    return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email)
  }

  if (is_for_admins) {
    return (
      <div className="w-full rounded-lg bg-[#1e1f3d]/30">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="admins" className="border-none">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24253c] ring-1 ring-white/10">
                  <IconUsers className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading text-sm text-gray-200`}
                  >
                    Administrators
                  </span>
                  <span
                    className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-gray-400`}
                  >
                    Admins have full edit permissions
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 px-4 py-3">
                <EmailInput
                  value={value}
                  error={error}
                  onKeyDown={handleKeyDown}
                  onChange={handleChange}
                  onPaste={handlePaste}
                />
                {courseAdmins.filter((email) => !superAdmins.includes(email))
                  .length > 0 && (
                  <div className="space-y-2">
                    {courseAdmins
                      .filter((email) => !superAdmins.includes(email))
                      .map((email) => (
                        <EmailListItem
                          key={email}
                          email={email}
                          onDelete={() => handleDelete(email)}
                          course_owner={metadata.course_owner}
                          course_admins={courseAdmins}
                        />
                      ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

  if (!is_private && !is_for_admins) return null

  return (
    <div className="w-full rounded-lg bg-[#1e1f3d]/30">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="members" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24253c] ring-1 ring-white/10">
                <IconUsers className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex flex-col items-start">
                <span
                  className={`${montserrat_heading.variable} font-montserratHeading text-sm text-gray-200`}
                >
                  Members
                </span>
                <span
                  className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-gray-400`}
                >
                  Only these email addresses can access the content
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 px-4 py-3">
              <EmailInput
                value={value}
                error={error}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                onPaste={handlePaste}
              />
              {emailAddresses.length > 0 && (
                <div className="space-y-2">
                  {emailAddresses.map((email) => (
                    <EmailListItem
                      key={email}
                      email={email}
                      onDelete={() => handleDelete(email)}
                      course_owner={metadata.course_owner}
                      course_admins={courseAdmins}
                    />
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default EmailListAccordion
