import {
  Card,
  Title,
  SimpleGrid,
  Flex,
  Text,
  Textarea,
  Button,
  Group,
  createStyles,
  ActionIcon,
} from '@mantine/core'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import SetExampleQuestions from './SetExampleQuestions'
import { callSetCourseMetadata, uploadToS3 } from '~/utils/apiUtils'
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { Montserrat } from 'next/font/google'
import CanvasIngestForm from './CanvasIngestForm'
import LargeDropzone from './LargeDropzone'
import WebsiteIngestForm from './WebsiteIngestForm'
import GitHubIngestForm from './GitHubIngestForm'
import MITIngestForm from './MITIngestForm'
import CourseraIngestForm from './CourseraIngestForm'
import { useState } from 'react'
import { IconShare } from '@tabler/icons-react'
import ShareSettingsModal from './ShareSettingsModal'

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
    color: (theme.colors as any).aiPurple[0],
    backgroundColor: (theme.colors as any).aiPurple[0],
    input: {
      color: (theme.colors as any).aiPurple[0],
      backgroundColor: (theme.colors as any).aiPurple[0],
    },
    root: {
      color: (theme.colors as any).aiPurple[0],
      backgroundColor: (theme.colors as any).aiPurple[0],
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

export function UploadCard({
  projectName,
  current_user_email,
  metadata,
}: {
  projectName: string
  current_user_email: string
  metadata: CourseMetadata
}) {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { classes, theme } = useStyles()
  const [projectDescription, setProjectDescription] = useState(
    metadata?.project_description || '',
  )
  const [introMessage, setIntroMessage] = useState(
    metadata?.course_intro_message || '',
  )
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
    >
      <Flex direction={isSmallScreen ? 'column' : 'row'}>
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 95%',
            border: 'None',
            color: 'white',
          }}
          className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
        >
          <Group mt="xl" align="center" position="center" w="100%">
            <Title
              order={2}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              className={`${montserrat_heading.variable} self-center font-montserratHeading`}
            >
              {projectName}
            </Title>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setIsShareModalOpen(true)}
              className={`ms-2 min-h-[2.5rem] transform rounded-xl bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none ${montserrat_paragraph.variable} font-montserratParagraph`}
            >
              Share Chatbot{' '}
              <span className="ml-2">
                <IconShare size={20} />
              </span>
            </Button>
          </Group>

          <LargeDropzone
            courseName={projectName}
            current_user_email={current_user_email as string}
            redirect_to_gpt_4={false}
            isDisabled={false}
            courseMetadata={metadata as CourseMetadata}
            is_new_course={false}
          />

          <SimpleGrid
            cols={3}
            spacing="lg"
            breakpoints={[
              { maxWidth: 1192, cols: 2, spacing: 'md' },
              { maxWidth: 768, cols: 1, spacing: 'sm' },
            ]}
            style={{
              width: '90%',
              margin: '0 auto',
              paddingTop: '30px',
              paddingBottom: '30px',
            }}
          >
            <CanvasIngestForm project_name={projectName} />

            <WebsiteIngestForm project_name={projectName} />

            <GitHubIngestForm project_name={projectName} />

            <MITIngestForm project_name={projectName} />

            <CourseraIngestForm />
          </SimpleGrid>
        </div>

        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
            padding: '1rem',
            backgroundColor: '#15162c',
            color: 'white',
          }}
        >
          <div className="card flex h-full flex-col justify-center">
            <div className="card-body">
              <div className="form-control relative">
                <Title
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                  variant="gradient"
                  gradient={{ from: 'gold', to: 'white', deg: 170 }}
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
                      backgroundColor: '#1A1B1E',
                      fontSize: '16px',
                      font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                    },
                    label: {
                      fontWeight: 'bold',
                      color: 'white',
                    },
                  }}
                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                />
                <Button
                  className={`w-1rem relative m-1 mt-3 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600`}
                  type="submit"
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
              <Title
                className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 170 }}
                order={3}
              >
                Branding{' '}
              </Title>
              <div className="form-control relative">
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text text-lg text-neutral-200">
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
                  value={introMessage}
                  onChange={(e) => {
                    setIntroMessage(e.target.value)
                    setIsIntroMessageUpdated(true)
                  }}
                />
                {isIntroMessageUpdated && (
                  <>
                    <Button
                      className="relative m-1 w-[30%] self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
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
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
              >
                <span className="label-text text-lg text-neutral-200">
                  Set example questions
                </span>
              </label>
              <Text
                className={`label ${montserrat_light.className} pb-0 pt-0`}
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
                  <span className="label-text text-lg text-neutral-200">
                    Upload your logo
                  </span>
                </label>
                <Text
                  size={'sm'}
                  className={`label ${montserrat_light.className}`}
                >
                  This logo will appear in the header of the chat page.
                </Text>
                <input
                  type="file"
                  className={`file-input-bordered file-input w-full border-violet-800 bg-violet-800 text-white  shadow-inner hover:border-violet-600 hover:bg-violet-800 ${montserrat_paragraph.variable} font-montserratParagraph`}
                  onChange={async (e) => {
                    // Assuming the file is converted to a URL somewhere else
                    if (e.target.files?.length) {
                      console.log('Uploading to s3')
                      const banner_s3_image = await uploadToS3(
                        e.target.files?.[0] ?? null,
                        projectName,
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
        metadata={metadata}
      />
    </Card>
  )
}
