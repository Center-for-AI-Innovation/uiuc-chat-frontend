import { IconAt, IconX, IconUser, IconUsers } from '@tabler/icons-react'
import React, {
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

function EmailListItem({
  email,
  onDelete,
  course_owner,
}: {
  email: string
  onDelete: () => void
  course_owner: string
}) {
  return (
    <div className="w-full px-4 py-3 transition-colors hover:bg-gray-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
            {email === course_owner ? (
              <IconUsers className="h-4 w-4" />
            ) : (
              <IconUser className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm text-gray-200">{email}</span>
            <span className="text-xs text-gray-400">
              Can {email === course_owner ? 'manage' : 'view'}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const EmailChipsComponent = ({
  course_name,
  course_owner,
  course_admins,
  is_private,
  onEmailAddressesChange,
  banner_image_s3,
  course_intro_message,
  openai_api_key,
  is_for_admins,
}: {
  course_name: string
  course_owner: string
  course_admins: string[]
  is_private: boolean
  onEmailAddressesChange?: (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => void // Add this prop type
  banner_image_s3: string
  course_intro_message: string
  openai_api_key: string
  is_for_admins: boolean
}) => {
  const [emailAddresses, setEmailAddresses] = useState<string[]>([])
  const [courseAdmins, setCourseAdmins] = useState<string[]>([]) // New state for course admins
  const [courseName, setCourseName] = useState<string>(course_name)
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const isPrivate = is_private

  // fetch metadata on mount
  useEffect(() => {
    fetchCourseMetadata(course_name).then((metadata) => {
      if (metadata) {
        metadata.is_private = JSON.parse(
          metadata.is_private as unknown as string,
        )
        // Initialize both states regardless of the is_for_admins flag
        setCourseAdmins(metadata.course_admins || [])
        setEmailAddresses(metadata.approved_emails_list || [])
      }
    })
  }, [course_name])

  const handleKeyDown_users = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()
      const trimmedValue = value.trim()

      if (trimmedValue && isValid(trimmedValue)) {
        if (is_for_admins) {
          const updatedCourseAdmins = [...courseAdmins, trimmedValue]
          setCourseAdmins(updatedCourseAdmins)
          updateCourseMetadata(updatedCourseAdmins, emailAddresses)
        } else {
          const updatedEmailAddresses = [...emailAddresses, trimmedValue]
          setEmailAddresses(updatedEmailAddresses)
          updateCourseMetadata(courseAdmins, updatedEmailAddresses)
        }
        setValue('')
      }
    }
  }

  const handleChange_users = (evt: ChangeEvent<HTMLInputElement>) => {
    setValue(evt.target.value)
    setError(null)
  }

  const handleDelete = (email_address: string) => {
    if (is_for_admins) {
      const updatedCourseAdmins = courseAdmins.filter(
        (admin) => admin !== email_address,
      )
      setCourseAdmins(updatedCourseAdmins)
      updateCourseMetadata(updatedCourseAdmins, emailAddresses)
    } else {
      const updatedEmailAddresses = emailAddresses.filter(
        (email) => email !== email_address,
      )
      setEmailAddresses(updatedEmailAddresses)
      updateCourseMetadata(courseAdmins, updatedEmailAddresses)
    }
  }

  const handlePaste_users = (evt: React.ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault()
    const paste = evt.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      const toBeAdded = emails.filter((email: string) => !isInList(email))
      if (is_for_admins) {
        const updatedCourseAdmins = [...courseAdmins, ...toBeAdded]
        setCourseAdmins(updatedCourseAdmins)
        updateCourseMetadata(updatedCourseAdmins, emailAddresses)
      } else {
        const updatedEmailAddresses = [...emailAddresses, ...toBeAdded]
        setEmailAddresses(updatedEmailAddresses)
        updateCourseMetadata(courseAdmins, updatedEmailAddresses)
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

  // Get and Set course exist in KV store
  const callRemoveUserFromCourse = async (email_to_remove: string) => {
    try {
      const course_name = courseName

      const url = new URL(
        '/api/UIUC-api/removeUserFromCourse',
        window.location.origin,
      )
      url.searchParams.append('course_name', course_name)
      url.searchParams.append('email_to_remove', email_to_remove)

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error removing user from course:', error)
      return false
    }
  }

  async function fetchCourseMetadata(course_name: string) {
    try {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      if (response.ok) {
        const data = await response.json()
        if (data.success === false) {
          console.error('An error occurred while fetching course metadata')
          return null
        }
        return data.course_metadata
      } else {
        console.error(`Error fetching course metadata: ${response.status}`)
        return null
      }
    } catch (error) {
      console.error('Error fetching course metadata:', error)
      return null
    }
  }

  const updateCourseMetadata = (admins: string[], emails: string[]) => {
    if (!admins.includes('kvday2@illinois.edu')) {
      admins.push('kvday2@illinois.edu')
    }
    const updatedMetadata = {
      is_private: isPrivate,
      course_owner: course_owner,
      course_admins: admins, // Always update course_admins with the current state
      approved_emails_list: emails, // Always update approved_emails_list with the current state
      course_intro_message: course_intro_message,
      banner_image_s3: banner_image_s3,
      openai_api_key: openai_api_key,
      example_questions: undefined,
      system_prompt: undefined,
      disabled_models: undefined,
      project_description: undefined,
    }
    onEmailAddressesChange &&
      onEmailAddressesChange(updatedMetadata, course_name)
    callSetCourseMetadata(courseName, updatedMetadata)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <IconAt className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Add people by email"
          className="w-full rounded-lg bg-gray-900 px-10 py-2.5 text-gray-200 placeholder-gray-400 ring-1 ring-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={value}
          onKeyDown={handleKeyDown_users}
          onChange={handleChange_users}
          onPaste={handlePaste_users}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-lg ">
        {(is_for_admins
          ? courseAdmins.filter((email) => email !== 'kvday2@illinois.edu')
          : emailAddresses
        ).length > 0 && (
          <div className="overflow-hidden rounded-lg bg-gray-900 ring-1 ring-gray-800">
            {(is_for_admins
              ? courseAdmins.filter((email) => email !== 'kvday2@illinois.edu')
              : emailAddresses
            ).map((email) => (
              <EmailListItem
                key={email}
                email={email}
                onDelete={() => handleDelete(email)}
                course_owner={course_owner}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailChipsComponent
