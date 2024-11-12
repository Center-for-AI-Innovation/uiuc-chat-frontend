import {
  TextInput,
  Chip,
  Group,
  createStyles,
  Stack,
  Avatar,
  Text,
  UnstyledButton,
  ActionIcon,
} from '@mantine/core'
import { IconAt, IconX } from '@tabler/icons-react'
import React, {
  useState,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

const useStyles = createStyles((theme) => ({
  emailList: {
    backgroundColor: '#1A1B1E',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  emailItem: {
    padding: '8px 16px',
    transition: 'background-color 150ms ease',

    '&:hover': {
      backgroundColor: '#2C2E33',
    },
  },
  removeButton: {
    color: theme.colors.gray[5],
    transition: 'color 150ms ease',

    '&:hover': {
      color: theme.colors.red[4],
    },
  },
  input: {
    input: {
      backgroundColor: '#1A1B1E',
      color: 'white',
      border: '1px solid #2C2E33',
      borderRadius: '8px',
      '&:focus': {
        borderColor: theme.colors.violet[4],
      },
    },
  },
}))

function EmailListItem({
  email,
  onDelete,
  classes,
  course_owner,
}: {
  email: string
  onDelete: () => void
  classes: any
  course_owner: string
}) {
  return (
    <UnstyledButton className={classes.emailItem}>
      <Group position="apart">
        <Group spacing="sm">
          <Avatar
            size={32}
            radius="xl"
            color="violet"
            styles={{ placeholder: { backgroundColor: '#2C2E33' } }}
          >
            {email[0]?.toUpperCase()}
          </Avatar>
          <div>
            <Text size="sm">{email}</Text>
            <Text size="xs" color="dimmed">
              Can {email === course_owner ? 'manage' : 'view'}
            </Text>
          </div>
        </Group>
        <ActionIcon
          className={classes.removeButton}
          onClick={onDelete}
          variant="subtle"
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>
    </UnstyledButton>
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
  const { classes } = useStyles()

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
    <Stack spacing="md">
      <TextInput
        icon={<IconAt />}
        placeholder="Add people by email"
        className={classes.input}
        value={value}
        error={error}
        onKeyDown={handleKeyDown_users}
        onChange={handleChange_users}
        onPaste={handlePaste_users}
      />
      <div className={classes.emailList}>
        {(is_for_admins
          ? courseAdmins.filter((email) => email !== 'kvday2@illinois.edu')
          : emailAddresses
        ).map((email) => (
          <EmailListItem
            key={email}
            email={email}
            onDelete={() => handleDelete(email)}
            classes={classes}
            course_owner={course_owner}
          />
        ))}
      </div>
    </Stack>
  )
}

export default EmailChipsComponent
