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

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${courseName}`,
      )
      const data = await response.json()
      if (data && data.documents) {
        setUploadFiles((prevFileUploads: FileUpload[]) => {
          return prevFileUploads.map((fileUpload) => {
            const isIngested = data.documents.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === fileUpload.name,
            );
            if (isIngested && fileUpload.status !== 'complete') {
              return { ...fileUpload, status: 'ingesting' as const };
            }
            return fileUpload;
          });
        });
      } else {
        // Mark all document uploads as complete if they're not in progress
        setUploadFiles((prev) => {
          return prev.map((upload) => {
            if (upload.type === "document" && upload.status === 'ingesting') {
              return { ...upload, status: 'complete' as const };
            }
            return upload;
          });
        });
      }
    }


    const intervalId = setInterval(fetchData, 3000) // Fetch data every 3000 milliseconds (3 seconds)
    return () => clearInterval(intervalId)
  }, [courseName])

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

    // this does parallel (use for loop for sequential)
    const allSuccessOrFail = await Promise.all(
      files.map(async (file, index) => {
        // Sanitize the filename and retain the extension
        const extension = file.name.slice(file.name.lastIndexOf('.'))
        const nameWithoutExtension = file.name
          .slice(0, file.name.lastIndexOf('.'))
          .replace(/[^a-zA-Z0-9]/g, '-')
        const uniqueFileName = `${uuidv4()}-${nameWithoutExtension}${extension}`
        const uniqueReadableFileName = `${nameWithoutExtension}${extension}`

        // return { ok: Math.random() < 0.5, s3_path: filename }; // For testing
        try {
          await uploadToS3(file, uniqueFileName)
          setSuccessfulUploads((prev) => prev + 1) // Increment successful uploads

          const response = await fetch(`/api/UIUC-api/ingest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uniqueFileName: uniqueFileName,
              courseName: courseName,
              readableFilename: uniqueReadableFileName,
            }),
          })
          const res = await response.json()
          console.debug('Ingest submitted...', res)
          return { ok: true, s3_path: file.name }
        } catch (error) {
          console.error('Error during file upload or ingest:', error)
          setUploadFiles((prev) =>
            prev.map((upload, i) =>
              i === index ? { ...upload, status: 'error' } : upload,
            ),
          )
          return { ok: false, s3_path: file.name }
        }
      }),
    )

    setSuccessfulUploads(files.length)
    setUploadComplete(true)
    interface IngestResult {
      ok: boolean
      s3_path: string
    }

    interface ResultSummary {
      success_ingest: IngestResult[]
      failure_ingest: IngestResult[]
    }

    const resultSummary = allSuccessOrFail.reduce(
      (acc: ResultSummary, curr: IngestResult) => {
        if (curr.ok) {
          acc.success_ingest.push(curr)
        } else {
          acc.failure_ingest.push(curr)
        }
        return acc
      },
      { success_ingest: [], failure_ingest: [] },
    )

    setUploadInProgress(false)

    if (is_new_course) {
      await router.push(`/${courseName}/materials`)
      return
    }

    // Toasts... but just for submitted to queue.
    // NOTE: Were just getting "SUBMISSION to task queue" status, not the success of the ingest job itself!!

    // if (resultSummary.success_ingest.length > 0) {
    //   showIngestInProgressToast(resultSummary.success_ingest.length)
    // }

    if (resultSummary.failure_ingest.length > 0) {
      // some failures
      showFailedIngestToast(
        resultSummary.failure_ingest.map(
          (ingestResult: IngestResult) => ingestResult.s3_path,
        ),
      )
      showSuccessToast(resultSummary.success_ingest.length)
    } else {
      // 100% success
      // TODO: Re-enable this great feature. But use ReactQuery to update the table, not full page refresh.
      // await refreshOrRedirect(redirect_to_gpt_4)
      // showSuccessToast(resultSummary.failure_ingest.map((ingestResult) => ingestResult.s3_path));
    }
  }

  return (
    <>
      {/* START LEFT COLUMN */}

      <div
        style={{
          display: 'flex',
          flexDirection: is_new_course && !isSmallScreen ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* <div className={classes.wrapper} style={{ maxWidth: '320px' }}> */}
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
          {/* {(uploadInProgress || uploadComplete) && (
            <UploadProgressBar
              numFiles={successfulUploads}
              totalFiles={files.length}
              isComplete={uploadComplete}
            />
          )} */}
          {/* <div className={courseName ? 'pb-4 pt-3' : ''}>
            {courseName && <IngestProgressBar courseName={courseName} />}
          </div> */}
          <Dropzone
            openRef={openRef}
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
              transition: 'all 0.2s ease',
              padding: '1rem',
              margin: '0 auto',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
            onDrop={async (files) => {
              ingestFiles(files, is_new_course).catch((error) => {
                console.error('Error during file upload:', error)
              })
            }}
            loading={uploadInProgress}
            className={`hover:border-purple-500 hover:bg-[#2a2a40] ${isDisabled ? 'opacity-50' : ''
              }`}
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
        {/* END LEFT COLUMN */}

        {/* START RIGHT COLUMN */}
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
        {/* END RIGHT COLUMN */}
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
