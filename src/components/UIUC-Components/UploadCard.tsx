import {
  Button,
  Card,
  createStyles,
  Flex,
  SimpleGrid,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata, uploadToS3 } from '~/utils/apiUtils'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import SetExampleQuestions from './SetExampleQuestions'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { IconShare } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { Montserrat } from 'next/font/google'
import { memo, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import CanvasIngestForm from './CanvasIngestForm'
import CourseraIngestForm from './CourseraIngestForm'
import GitHubIngestForm from './GitHubIngestForm'
import LargeDropzone from './LargeDropzone'
import MITIngestForm from './MITIngestForm'
import ShareSettingsModal from './ShareSettingsModal'
import UploadNotification, { type FileUpload } from './UploadNotification'
import WebsiteIngestForm from './WebsiteIngestForm'

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const useStyles = createStyles((theme) => ({
  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  switch: {
    color: 'var(--dashboard-button-foreground)',
    backgroundColor: 'var(--dashboard-button)',
    input: {
      color: 'var(--foreground)',
      backgroundColor: 'var(--background)',
    },
    root: {
      color: 'var(--foreground)',
      backgroundColor: 'var(--background)',
    },
  },
  item: {
    backgroundColor: 'bg-transparent',
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(90deg)',
    },
  },
}))

export const UploadCard = memo(function UploadCard({
  projectName,
  current_user_email,
  metadata: initialMetadata,
  sidebarCollapsed = false,
}: {
  projectName: string
  current_user_email: string
  metadata: CourseMetadata
  sidebarCollapsed?: boolean
}) {
  const auth = useAuth()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  // Get responsive card width classes based on sidebar state
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed || false)
  const [projectDescription, setProjectDescription] = useState(
    initialMetadata?.project_description || '',
  )
  const queryClient = useQueryClient()
  const [introMessage, setIntroMessage] = useState(
    initialMetadata?.course_intro_message || '',
  )
  const [showNotification, setShowNotification] = useState(false)
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])
  const [metadata, setMetadata] = useState(initialMetadata)

  useEffect(() => {
    // Set initial query data
    queryClient.setQueryData(['courseMetadata', projectName], initialMetadata)
  }, [])

  // Update local state when query data changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const latestData = queryClient.getQueryData([
        'courseMetadata',
        projectName,
      ])
      if (latestData) {
        setMetadata(latestData as CourseMetadata)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [projectName, queryClient])

  const handleCloseNotification = () => {
    setShowNotification(false)
    setUploadFiles([])
  }
  const handleSetUploadFiles = (
    updateFn: React.SetStateAction<FileUpload[]>,
  ) => {
    setUploadFiles(updateFn)
  }
  return (
    <Card
      withBorder
      padding="none"
      radius="xl"
      className={`mt-[2%] ${cardWidthClasses}`}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--dashboard-border)',
      }}
    >
      <Flex direction={isSmallScreen ? 'column' : 'row'}>
        <div
          style={{
            flex: '1 1 95%',
            border: 'None',
            color: 'var(--foreground)',
          }}
          className="min-h-full bg-[--background]"
        >
          <div className="w-full border-b border-[--dashboard-border] px-4 py-3 sm:px-6 sm:py-4 md:px-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Title
                  order={2}
                  className={`${montserrat_heading.variable} font-montserratHeading text-lg text-[--foreground] sm:text-2xl`}
                >
                  Dashboard
                </Title>
                <Text className="text-[--foreground]">/</Text>
                <Title
                  order={3}
                  className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base text-[--illinois-orange] sm:text-xl ${
                    projectName.length > 40
                      ? 'max-w-[120px] truncate sm:max-w-[300px] lg:max-w-[400px]'
                      : ''
                  }`}
                >
                  {projectName}
                </Title>
              </div>

              <div className="-inset-0.25 relative shrink-0 rounded-3xl p-0.5">
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setIsShareModalOpen(true)}
                  className={`relative transform rounded-3xl bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none
                    ${montserrat_paragraph.variable} min-h-[2rem]
                    px-2 font-montserratParagraph
                    text-sm sm:min-h-[2.5rem]
                    sm:px-4 sm:text-base
                  `}
                >
                  <span className="hidden sm:inline">Share Chatbot</span>
                  <span className="inline sm:hidden">Share</span>
                  <IconShare size={12} className="ml-1 inline sm:hidden" />
                  <IconShare size={20} className="ml-2 hidden sm:inline" />
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 pt-2 sm:px-6 sm:pt-2 md:px-8">
            <LargeDropzone
              courseName={projectName}
              current_user_email={current_user_email as string}
              redirect_to_gpt_4={false}
              isDisabled={false}
              courseMetadata={metadata as CourseMetadata}
              is_new_course={false}
              setUploadFiles={handleSetUploadFiles}
              auth={auth}
            />
          </div>

          <SimpleGrid
            cols={3}
            spacing="lg"
            breakpoints={[
              { maxWidth: 1192, cols: 2, spacing: 'md' },
              { maxWidth: 768, cols: 1, spacing: 'sm' },
            ]}
            className="px-4 py-4 sm:px-6 sm:py-6 md:px-8"
          >
            <CanvasIngestForm
              project_name={projectName}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <WebsiteIngestForm
              project_name={projectName}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <GitHubIngestForm
              project_name={projectName}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <MITIngestForm
              project_name={projectName}
              setUploadFiles={handleSetUploadFiles}
              queryClient={queryClient}
            />

            <CourseraIngestForm />
          </SimpleGrid>
          <UploadNotification
            files={uploadFiles}
            onClose={handleCloseNotification}
            projectName={projectName}
          />
        </div>

        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
            backgroundColor: 'var(--dashboard-sidebar-background)',
            color: 'var(--dashboard-foreground)',
            borderLeft: isSmallScreen
              ? ''
              : '1px solid var(--dashboard-border)',
          }}
          className="p-4 sm:p-6"
        >
          <div className="card flex h-full flex-col justify-start space-y-6">
            <div className="form-control">
              <Title
                className={`${montserrat_heading.variable} mb-4 font-montserratHeading text-[--dashboard-foreground]`}
                order={3}
              >
                Project Description
              </Title>
              <Textarea
                placeholder="Describe your project, goals, expected impact etc..."
                radius={'sm'}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                size={'lg'}
                minRows={4}
                styles={{
                  input: {
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--background)',
                    fontSize: '16px',
                    font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                  },
                }}
                className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              />
              <Button
                className="mt-3 w-24 self-end bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
                onClick={async () => {
                  if (metadata) {
                    metadata.project_description = projectDescription
                    const resp = await callSetCourseMetadata(
                      projectName,
                      metadata,
                    )
                    if (!resp) {
                      console.log(
                        'Error upserting course metadata for course: ',
                        projectName,
                      )
                    }
                  }
                }}
              >
                Update
              </Button>
            </div>

            <div className="space-y-2">
              <Title
                className={`${montserrat_heading.variable} font-montserratHeading text-[--dashboard-foreground]`}
                order={3}
              >
                Branding
              </Title>

              <div className="form-control relative">
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text-unused text-lg">
                    Set a greeting
                  </span>
                </label>
                <Text
                  className={`label ${montserrat_light.className} pt-0`}
                  size={'sm'}
                >
                  Shown before users send their first chat.
                </Text>
                <Textarea
                  autosize
                  minRows={2}
                  maxRows={4}
                  placeholder="Enter a greeting to help users get started with your bot"
                  className={`w-full ${montserrat_paragraph.variable} font-montserratParagraph`}
                  styles={{
                    input: {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--background)',
                    },
                  }}
                  value={introMessage}
                  onChange={(e) => {
                    setIntroMessage(e.target.value)
                    setIsIntroMessageUpdated(true)
                  }}
                />
                {isIntroMessageUpdated && (
                  <>
                    <Button
                      className="relative m-1 w-[30%] self-end bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
                      type="submit"
                      onClick={async () => {
                        setIsIntroMessageUpdated(false)
                        if (metadata) {
                          metadata.course_intro_message = introMessage
                          // Update the courseMetadata object

                          const resp = await callSetCourseMetadata(
                            projectName,
                            metadata,
                          )
                          if (!resp) {
                            console.log(
                              'Error upserting course metadata for course: ',
                              projectName,
                            )
                          }
                        }
                      }}
                    >
                      Submit
                    </Button>
                  </>
                )}
              </div>
              <label
                className={`label !mt-8 ${montserrat_heading.variable} pt-0 font-montserratHeading`}
              >
                <span className="label-text-unused text-lg">
                  Set example questions
                </span>
              </label>
              <Text
                className={`label !mt-0 ${montserrat_light.className} pb-0`}
                mb={-3}
                size={'sm'}
              >
                Users will likely try these first to get a feel for your bot.
              </Text>
              <SetExampleQuestions
                course_name={projectName}
                course_metadata={metadata as CourseMetadataOptionalForUpsert}
              />
              <div className="form-control">
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text-unused text-lg">
                    Upload your logo
                  </span>
                </label>
                <Text
                  size={'sm'}
                  className={`label !mt-0 ${montserrat_light.className}`}
                >
                  This logo will appear in the header of the chat page.
                </Text>
                <input
                  type="file"
                  className={`file-input-bordered file-input w-full cursor-pointer border-[--foreground] bg-[--background] text-sm text-[--foreground] shadow-inner hover:border-[--dashboard-button] hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground] ${montserrat_paragraph.variable} font-montserratParagraph`}
                  onChange={async (e) => {
                    // Assuming the file is converted to a URL somewhere else
                    if (e.target.files?.length) {
                      console.log('Uploading to s3')
                      const banner_s3_image = await uploadToS3(
                        e.target.files?.[0] ?? null,
                        '', // No user_id needed for course logos
                        projectName,
                        'document-group', // Course logos belong with course materials
                      )
                      if (banner_s3_image && metadata) {
                        metadata.banner_image_s3 = banner_s3_image
                        await callSetCourseMetadata(projectName, metadata)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Flex>
      <ShareSettingsModal
        opened={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectName={projectName}
        metadata={{
          ...metadata,
          approved_emails_list: metadata.approved_emails_list || [],
          course_admins: metadata.course_admins || [],
        }}
      />
    </Card>
  )
})
