// LargeDropzone.tsx
import React, { useRef, useState, useEffect } from 'react'
import {
  createStyles,
  Group,
  rem,
  Text,
  Title,
  Paper,
  Progress,
  // useMantineTheme,
} from '@mantine/core'

import {
  IconAlertCircle,
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconFileUpload,
  IconX,
} from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dropzone } from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { notifications } from '@mantine/notifications'
import { v4 as uuidv4 } from 'uuid'
import { FileUpload } from './UploadNotification'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    // marginBottom: rem(10),
  },

  icon: {
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}))

export function LargeDropzone({
  courseName,
  current_user_email,
  redirect_to_gpt_4 = true,
  isDisabled = false,
  courseMetadata,
  is_new_course,
  setUploadFiles,
}: {
  courseName: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
  courseMetadata: CourseMetadata
  is_new_course: boolean
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
}) {
  // upload-in-progress spinner control
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [successfulUploads, setSuccessfulUploads] = useState(0)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { classes, theme } = useStyles()
  const openRef = useRef<() => void>(null)
  const [files, setFiles] = useState<File[]>([])

  const refreshOrRedirect = async (redirect_to_gpt_4: boolean) => {
    if (is_new_course) {
      // refresh current page
      await new Promise((resolve) => setTimeout(resolve, 200))
      await router.push(`/${courseName}/materials`)
      return
    }

    if (redirect_to_gpt_4) {
      await router.push(`/${courseName}/chat`)
    }
    // refresh current page
    await new Promise((resolve) => setTimeout(resolve, 200))
    await router.reload()
  }
  const uploadToS3 = async (file: File | null, uniqueFileName: string) => {
    if (!file) return

    const requestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uniqueFileName: uniqueFileName,
        fileType: file.type,
        courseName: courseName,
      }),
    }

    try {
      interface PresignedPostResponse {
        post: {
          url: string
          fields: { [key: string]: string }
        }
      }

      // Then, update the lines where you fetch the response and parse the JSON
      const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
      const data = (await response.json()) as PresignedPostResponse

      const { url, fields } = data.post as {
        url: string
        fields: { [key: string]: string }
      }
      const formData = new FormData()

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append('file', file)

      await fetch(url, {
        method: 'POST',
        body: formData,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const ingestFiles = async (files: File[] | null, is_new_course: boolean) => {
    if (!files) return
    files = files.filter((file) => file !== null)

    setFiles(files)
    setSuccessfulUploads(0)
    setUploadInProgress(true)
    setUploadComplete(false)

    // Initialize file upload status
    const initialFileUploads = files.map((file) => {
      const extension = file.name.slice(file.name.lastIndexOf('.'))
      const nameWithoutExtension = file.name
        .slice(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueReadableFileName = `${nameWithoutExtension}${extension}`

      return {
        name: uniqueReadableFileName,
        status: 'uploading' as const,
        type: 'document' as const,
      }
    })
    setUploadFiles((prev) => [...prev, ...initialFileUploads])
    // setUploadFiles(prev => {
    //   const newFiles = initialFileUploads.filter(
    //     newFile => !prev.some(existingFile => existingFile.name === newFile.name)
    //   )
    //   return [...prev, ...newFiles]
    // })
    if (is_new_course) {
      await callSetCourseMetadata(
        courseName,
        courseMetadata || {
          course_owner: current_user_email,
          course_admins: undefined,
          approved_emails_list: undefined,
          is_private: undefined,
          banner_image_s3: undefined,
          course_intro_message: undefined,
        },
      )
    }
  }

  // Add useEffect to check ingest status
  useEffect(() => {
    const checkIngestStatus = async () => {
      console.log('Checking ingest status for course:', courseName)
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${courseName}`,
      )
      const data = await response.json()
      console.log('Received ingest status data:', data)

      if (!data) {
        console.log('No data received from API')
        return
      }

      if (!data.documents) {
        console.log('No documents found in API response')
        setUploadFiles((prev) =>
          prev.map((file) => ({ ...file, status: 'complete' as const })),
        )
        return
      }

      setUploadFiles((prev) => {
        console.log('Current upload files:', prev)
        const updated = prev.map((file) => {
          console.log(
            'Processing file:',
            file.name,
            'Current status:',
            file.status,
          )

          // If file is in ingesting state, check if it's still in progress
          if (file.status === 'ingesting') {
            const isStillIngesting = data.documents.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )
            console.log(`File ${file.name} still ingesting:`, isStillIngesting)

            // If not in progress anymore, mark as complete
            if (!isStillIngesting) {
              console.log(`File ${file.name} completed ingestion`)
              return { ...file, status: 'complete' as const }
            } else {
              console.log(`File ${file.name} continues ingesting`)
              return file
            }
          } else if (file.status === 'uploading') {
            const isIngesting = data.documents.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )
            console.log(`File ${file.name} started ingesting:`, isIngesting)

            if (isIngesting) {
              console.log(
                `File ${file.name} transitioning from uploading to ingesting`,
              )
              return { ...file, status: 'ingesting' as const }
            } else {
              console.log(`File ${file.name} still uploading`)
              return file
            }
          } else {
            console.log(
              `File ${file.name} in status ${file.status}, no change needed`,
            )
            return file
          }
        })
        console.log('Updated upload files:', updated)
        return updated
      })
    }

    console.log('Setting up ingest status check interval')
    const interval = setInterval(checkIngestStatus, 3000)
    return () => {
      console.log('Cleaning up ingest status check interval')
      clearInterval(interval)
    }
  }, [courseName]) // Only depend on courseName

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: is_new_course && !isSmallScreen ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          className={classes.wrapper}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            paddingTop: rem(24),
          }}
        >
          <Dropzone
            openRef={openRef}
            className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
              width: '100%',
              minHeight: rem(200),
              height: 'auto',
              backgroundColor: isDisabled ? '#3a374a' : '#1c1c2e',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              borderWidth: '2px',
              borderStyle: 'dashed',
              borderColor: 'rgba(147, 51, 234, 0.3)',
              borderRadius: rem(12),
              padding: '1rem',
              margin: '0 auto',
              maxWidth: '100%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1c1c2e 0%, #2a2a40 100%)',
              transition: 'all 0.3s ease, background-position 0.3s ease',
              backgroundSize: '200% 200%',
              backgroundPosition: '0% 0%',
              ':hover': {
                backgroundPosition: '100% 100%',
                background: 'linear-gradient(135deg, #2a2a40 0%, #1c1c2e 100%)',
              },
            }}
            onDrop={async (files) => {
              ingestFiles(files, is_new_course).catch((error) => {
                console.error('Error during file upload:', error)
              })
            }}
            loading={uploadInProgress}
          >
            <div
              style={{ pointerEvents: 'none' }}
              className="flex flex-col items-center justify-center px-2 sm:px-4"
            >
              <Group position="center" pt={rem(12)} className="sm:pt-5">
                <Dropzone.Accept>
                  <IconDownload
                    size={isSmallScreen ? rem(30) : rem(50)}
                    color="#9333ea"
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={isSmallScreen ? rem(30) : rem(50)}
                    color="#ef4444"
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                {!isDisabled && (
                  <Dropzone.Idle>
                    <IconCloudUpload
                      size={isSmallScreen ? rem(30) : rem(50)}
                      color="#9333ea"
                      stroke={1.5}
                    />
                  </Dropzone.Idle>
                )}
              </Group>

              <Text
                ta="center"
                fw={700}
                fz={isSmallScreen ? 'md' : 'lg'}
                mt={isSmallScreen ? 'md' : 'xl'}
                className="text-gray-200"
              >
                <Dropzone.Accept>Drop files here</Dropzone.Accept>
                <Dropzone.Reject>
                  Upload rejected, not proper file type or too large.
                </Dropzone.Reject>
                <Dropzone.Idle>
                  {isDisabled
                    ? 'Enter an available project name above! 👀'
                    : 'Upload materials'}
                </Dropzone.Idle>
              </Text>

              {!isDisabled && (
                <Text
                  ta="center"
                  fz={isSmallScreen ? 'xs' : 'sm'}
                  mt="xs"
                  className="text-gray-400"
                >
                  Drag&apos;n&apos;drop files or a whole folder here
                </Text>
              )}

              <div className="mt-2 w-full overflow-x-hidden sm:mt-4">
                <SupportedFileUploadTypes />
              </div>
            </div>
          </Dropzone>
          {/* {uploadInProgress && (
            <div className="flex flex-col items-center justify-center px-4 text-center">
              <Title
                order={4}
                style={{
                  marginTop: 10,
                  color: '#B22222',
                  fontSize: isSmallScreen ? '0.9rem' : '1rem',
                  lineHeight: '1.4',
                }}
              >
                Remain on this page until upload is complete
                <br />
                or ingest will fail.
              </Title>
            </div>
          )} */}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}
        ></div>
      </div>
    </>
  )
}

export default LargeDropzone

const showFailedIngestToast = (error_files: string[]) => {
  // docs: https://mantine.dev/others/notifications/

  error_files.forEach((file, index) => {
    notifications.show({
      id: `failed-ingest-toast-${index}`,
      withCloseButton: true,
      // onClose: () => console.log('unmounted'),
      // onOpen: () => console.log('mounted'),
      autoClose: 30000,
      title: `Failed to ingest file ${file}`,
      message: `Please shoot me an email: kvday2@illinois.edu.`,
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: { backgroundColor: '#15162c' },
      loading: false,
    })
  })
}

const showSuccessToast = (num_success_files: number) => {
  // success_files.forEach((file, index) => {
  notifications.show({
    id: `success-ingest-toast-${num_success_files}`,
    withCloseButton: true,
    // onClose: () => console.log('unmounted'),
    // onOpen: () => console.log('mounted'),
    autoClose: 30000,
    title: `Successfully ingested ${num_success_files} files.`,
    message: `Refresh page to see changes.`,
    color: 'green',
    radius: 'lg',
    icon: <IconCheck />,
    className: 'my-notification-class',
    style: { backgroundColor: '#15162c' },
    loading: false,
    // })
  })
}
