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
import { useFetchDocsInProgress } from '~/hooks/queries/useFetchDocsInProgress'
import { useFetchSuccessDocs } from '~/hooks/queries/useFetchSuccessDocs'
import { Dropzone } from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'
import { useMediaQuery } from '@mantine/hooks'
import { useSetCourseMetadata } from '@/hooks/queries/useSetCourseMetadata'
import { v4 as uuidv4 } from 'uuid'
import { type FileUpload } from './UploadNotification'
import { useUploadToS3 } from '~/hooks/queries/useUploadToS3'
import { useIngest } from '~/hooks/queries/useIngest'
import { type AuthContextProps } from 'react-oidc-context'

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
  dropzone: {
    backgroundPosition: '0% 0%',
    '&:hover': {
      backgroundPosition: '100% 100%',
      background: 'linear-gradient(135deg, #2a2a40 0%, #1c1c2e 100%)',
    },
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
  auth,
}: {
  courseName: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
  courseMetadata: CourseMetadata
  is_new_course: boolean
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  auth: AuthContextProps
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
      await router.push(`/${courseName}/dashboard`)
      return
    }

    if (redirect_to_gpt_4) {
      await router.push(`/${courseName}/chat`)
    }
    // refresh current page
    await new Promise((resolve) => setTimeout(resolve, 200))
    await router.reload()
  }
  const { refetch: refetchSuccessDocs } = useFetchSuccessDocs(courseName)
  const uploadToS3Mutation = useUploadToS3()
  const ingestMutation = useIngest()
  const { mutateAsync: setCourseMetadataAsync } =
    useSetCourseMetadata(courseName)

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

    if (is_new_course) {
      await setCourseMetadataAsync(
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

    // Process files in parallel
    const allSuccessOrFail = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.slice(file.name.lastIndexOf('.'))
        const nameWithoutExtension = file.name
          .slice(0, file.name.lastIndexOf('.'))
          .replace(/[^a-zA-Z0-9]/g, '-')
        const uniqueFileName = `${uuidv4()}-${nameWithoutExtension}${extension}`
        const uniqueReadableFileName = `${nameWithoutExtension}${extension}`

        try {
          await uploadToS3Mutation.mutateAsync({
            file,
            uniqueFileName,
            courseName,
          })
          setSuccessfulUploads((prev) => prev + 1)

          const res = await ingestMutation.mutateAsync({
            uniqueFileName,
            courseName,
            readableFilename: uniqueReadableFileName,
          })
          console.debug('Ingest submitted...', res)
          return { ok: true, s3_path: file.name }
        } catch (error) {
          console.error('Error during file upload or ingest:', error)
          // Update file status to error so it doesn't block navigation
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.name === uniqueReadableFileName ? { ...f, status: 'error' } : f,
            ),
          )
          return { ok: false, s3_path: file.name }
        }
      }),
    )

    setSuccessfulUploads(files.length)
    setUploadComplete(true)

    // Process results
    const resultSummary = allSuccessOrFail.reduce(
      (acc: { success_ingest: any[]; failure_ingest: any[] }, curr) => {
        if (curr.ok) acc.success_ingest.push(curr)
        else acc.failure_ingest.push(curr)
        return acc
      },
      { success_ingest: [], failure_ingest: [] },
    )

    setUploadInProgress(false)

    if (is_new_course) {
      await refreshOrRedirect(redirect_to_gpt_4)
    }
  }
  const { refetch: refetchDocsInProgress } = useFetchDocsInProgress(courseName)

  useEffect(() => {
    let pollInterval = 9000 // Start with a slower interval
    const MIN_INTERVAL = 1000 // Fast polling when active
    const MAX_INTERVAL = 20000 // Slow polling when inactive
    let consecutiveEmptyPolls = 0

    const checkIngestStatus = async () => {
      const { data } = await refetchDocsInProgress()

      const { data: successDocs } = await refetchSuccessDocs()
      const docsData = { documents: successDocs }
      // Adjust polling interval based on activity
      if (data && data.documents.length > 0) {
        pollInterval = MIN_INTERVAL
        consecutiveEmptyPolls = 0
      } else {
        consecutiveEmptyPolls++
        if (consecutiveEmptyPolls >= 3) {
          // After 3 empty polls, slow down
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
        }
      }

      setUploadFiles((prev) => {
        return prev.map((file) => {
          if (file.type !== 'document') return file

          if (file.status === 'uploading') {
            const isIngesting = data?.documents?.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )
            if (isIngesting) {
              return { ...file, status: 'ingesting' }
            } else {
              // Ingest can happen very quickly, check if completed also
              const isInCompletedDocs = docsData?.documents?.some(
                (doc: { readable_filename: string }) =>
                  doc.readable_filename === file.name,
              )
              if (isInCompletedDocs) {
                return { ...file, status: 'complete' }
              }
            }
          } else if (file.status === 'ingesting') {
            const isStillIngesting = data?.documents?.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )

            if (!isStillIngesting) {
              const isInCompletedDocs = docsData?.documents?.some(
                (doc: { readable_filename: string }) =>
                  doc.readable_filename === file.name,
              )
              return {
                ...file,
                status: isInCompletedDocs
                  ? ('complete' as const)
                  : ('error' as const),
              }
            }
          }
          return file
        })
      })
    }

    const intervalId = setInterval(checkIngestStatus, pollInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [courseName])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
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
              backgroundColor: isDisabled
                ? 'var(--background-faded)'
                : 'var(--background)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              borderWidth: '2px',
              borderStyle: 'dashed',
              borderColor: 'var(--dashboard-border)',
              borderRadius: rem(12),
              padding: '1rem',
              margin: '0 auto',
              maxWidth: '100%',
              overflow: 'hidden',
              background: 'var(--background)',
            }}
            onDrop={async (files) => {
              // Common audio and video file extensions to block
              const audioVideoExtensions = [
                // Audio extensions
                '.mp3',
                '.wav',
                '.ogg',
                '.m4a',
                '.flac',
                '.aac',
                '.wma',
                '.aiff',
                '.ape',
                '.opus',
                // Video extensions
                '.mp4',
                '.avi',
                '.mov',
                '.wmv',
                '.flv',
                '.mkv',
                '.webm',
                '.m4v',
                '.mpg',
                '.mpeg',
                '.3gp',
              ]

              const hasRejected = files.some((f) => {
                // Check MIME type
                const hasMimeType =
                  f.type.startsWith('audio/') || f.type.startsWith('video/')

                // Check file extension as fallback
                const fileName = f.name.toLowerCase()
                const hasExtension = audioVideoExtensions.some((ext) =>
                  fileName.endsWith(ext),
                )

                return hasMimeType || hasExtension
              })

              if (hasRejected) {
                alert('Audio and video files are not supported at this time.')
                return
              }

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
                    color="var(--dashboard-foreground)"
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={isSmallScreen ? rem(30) : rem(50)}
                    color="var(--error)"
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                {!isDisabled && (
                  <Dropzone.Idle>
                    <IconCloudUpload
                      size={isSmallScreen ? rem(30) : rem(50)}
                      color="var(--illinois-orange)"
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
                className="text-[--dashboard-foreground]"
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
                  className="text-[--foreground-faded]"
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
      </div>
    </>
  )
}

export default LargeDropzone
