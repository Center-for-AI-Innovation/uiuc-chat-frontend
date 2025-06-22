import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useAuth } from 'react-oidc-context'
import { useRouter } from 'next/router'
import {
  Card,
  Title,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconPlus,
  IconUsers,
  IconLock,
  IconWorld,
  IconChevronRight,
  IconSettings,
} from '@tabler/icons-react'
import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { initiateSignIn } from '~/utils/authHelpers'

interface ProjectCardData {
  name: string
  metadata: CourseMetadata
}

const ProjectCard: React.FC<{ project: ProjectCardData }> = ({ project }) => {
  const router = useRouter()
  const { name, metadata } = project

  const handleCardClick = () => {
    router.push(`/${name}/chat`)
  }

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/${name}`)
  }

  return (
    <Card
      shadow="md"
      padding="lg"
      radius="xl"
      className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
      onClick={handleCardClick}
      style={{
        background: 'var(--background)',
        boxShadow: '4px 4px 15px rgba(0,0,0, .15)',
        border: '1px solid rgba(139, 92, 246, 0.1)',
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header with title and settings */}
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Title
              order={3}
              className={`${montserrat_heading.variable} truncate font-montserratHeading text-lg font-bold`}
              style={{ color: 'var(--illinois-blue)' }}
            >
              {name}
            </Title>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <Tooltip label="Project Settings" position="top">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={handleSettingsClick}
                className="hover:bg-gray-100"
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4 flex-1">
          <Text
            size="sm"
            className={`${montserrat_paragraph.variable} line-clamp-3 font-montserratParagraph text-gray-600`}
          >
            {metadata.project_description ||
              metadata.course_intro_message ||
              'No description available'}
          </Text>
        </div>

        {/* Privacy badge and owner info */}
        <div className="mb-3 flex items-center justify-between">
          <Badge
            variant="light"
            color={metadata.is_private ? 'red' : 'green'}
            leftSection={
              metadata.is_private ? (
                <IconLock size={12} />
              ) : (
                <IconWorld size={12} />
              )
            }
          >
            {metadata.is_private ? 'Private' : 'Public'}
          </Badge>
          <Text size="xs" color="dimmed">
            Owner: {metadata.course_owner.split('@')[0]}
          </Text>
        </div>

        {/* Admins info */}
        {metadata.course_admins && metadata.course_admins.length > 1 && (
          <div className="mb-3">
            <Group spacing="xs" align="center">
              <IconUsers size={14} color="var(--illinois-blue)" />
              <Text size="xs" color="dimmed">
                {
                  metadata.course_admins.filter(
                    (admin) => admin !== 'rohan13@illinois.edu',
                  ).length
                }{' '}
                admin(s)
              </Text>
            </Group>
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-between">
          <Button
            variant="light"
            size="xs"
            rightIcon={<IconChevronRight size={14} />}
            style={{
              backgroundColor: 'var(--illinois-orange)',
              color: 'var(--illinois-white)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleCardClick()
            }}
          >
            Open Chat
          </Button>
        </div>
      </div>
    </Card>
  )
}

const NewProjectCard: React.FC = () => {
  const router = useRouter()

  return (
    <Card
      shadow="md"
      padding="lg"
      radius="xl"
      className="cursor-pointer border-2 border-dashed transition-all duration-300 hover:scale-105 hover:shadow-xl"
      onClick={() => router.push('/new')}
      style={{
        background:
          'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.1))',
        borderColor: 'var(--illinois-orange)',
        minHeight: '250px',
      }}
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-orange-100 p-4">
          <IconPlus size={32} color="var(--illinois-orange)" />
        </div>
        <Title
          order={4}
          className={`${montserrat_heading.variable} mb-2 font-montserratHeading`}
          style={{ color: 'var(--illinois-blue)' }}
        >
          Create New Project
        </Title>
        <Text
          size="sm"
          className={`${montserrat_paragraph.variable} font-montserratParagraph text-gray-600`}
        >
          Build your own AI chatbot with custom documents and data
        </Text>
      </div>
    </Card>
  )
}

const Home: React.FC = () => {
  const auth = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle authentication redirect if user is not authenticated
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Use the same authentication helper pattern as other pages
      void initiateSignIn(auth, '/home')
      return
    }
  }, [auth.isLoading, auth.isAuthenticated])

  useEffect(() => {
    const fetchProjects = async () => {
      if (auth.isLoading) return

      if (!auth.isAuthenticated) {
        setIsLoading(false)
        return
      }

      if (!auth.user?.profile.email) {
        setError('No email found for user')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${auth.user.profile.email}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const data = await response.json()

        const projectData: ProjectCardData[] = data
          .map((item: { [key: string]: CourseMetadata }) => {
            const projectName = Object.keys(item)[0]
            if (!projectName) return null

            const metadata = item[projectName]
            if (!metadata) return null

            return {
              name: projectName,
              metadata: metadata,
            }
          })
          .filter(
            (item: ProjectCardData | null): item is ProjectCardData =>
              item !== null,
          )

        setProjects(projectData)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.profile.email])

  // Show loading spinner while auth is loading or we're fetching data
  if (auth.isLoading || isLoading) {
    return (
      <>
        <Head>
          <title>Home - Illinois Chat</title>
        </Head>
        <LandingPageHeader />
        <main className="flex min-h-screen flex-col items-center justify-center">
          <LoadingSpinner />
        </main>
      </>
    )
  }

  // If not authenticated, the useEffect above will handle redirect
  // Just show loading state briefly
  if (!auth.isAuthenticated) {
    return (
      <>
        <Head>
          <title>Home - Illinois Chat</title>
        </Head>
        <LandingPageHeader />
        <main className="flex min-h-screen flex-col items-center justify-center">
          <LoadingSpinner />
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Home - Illinois Chat</title>
        <meta
          name="description"
          content="Your Illinois Chat projects dashboard"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPageHeader />

      <main
        className={`illinois-blue-gradient-bg flex min-h-screen flex-col ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        <div className="container mx-auto max-w-7xl px-4 py-8 pt-24">
          {/* Welcome section */}
          <div className="mb-8 text-center">
            <Title
              order={1}
              className={`${montserrat_heading.variable} mb-4 font-montserratHeading text-4xl font-bold`}
              style={{ color: 'var(--illinois-blue)' }}
            >
              Welcome back,{' '}
              {auth.user?.profile.given_name ||
                auth.user?.profile.email?.split('@')[0]}
              !
            </Title>
            <Text
              size="lg"
              className={`${montserrat_paragraph.variable} font-montserratParagraph text-gray-600`}
            >
              Manage your AI chatbots and create new ones
            </Text>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-8 text-center">
              <Text color="red" size="lg">
                {error}
              </Text>
            </div>
          )}

          {/* Projects grid */}
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <Title
                order={2}
                className={`${montserrat_heading.variable} font-montserratHeading text-2xl font-bold`}
                style={{ color: 'var(--illinois-blue)' }}
              >
                Your Projects
              </Title>
              <Text color="dimmed" size="sm">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </Text>
            </div>

            <SimpleGrid
              cols={4}
              spacing="lg"
              className="auto-rows-fr"
              breakpoints={[
                { maxWidth: 'md', cols: 3 },
                { maxWidth: 'sm', cols: 2 },
                { maxWidth: 'xs', cols: 1 },
              ]}
            >
              <NewProjectCard />
              {projects.map((project) => (
                <ProjectCard key={project.name} project={project} />
              ))}
            </SimpleGrid>

            {projects.length === 0 && !error && (
              <div className="mt-12 text-center">
                <Text
                  size="lg"
                  className={`${montserrat_paragraph.variable} mb-4 font-montserratParagraph text-gray-600`}
                >
                  You haven&apos;t created any projects yet.
                </Text>
                <Button
                  variant="light"
                  size="md"
                  onClick={() => router.push('/new')}
                  style={{
                    backgroundColor: 'var(--illinois-orange)',
                    color: 'var(--illinois-white)',
                  }}
                >
                  Create Your First Project
                </Button>
              </div>
            )}
          </div>
        </div>

        <GlobalFooter />
      </main>
    </>
  )
}

export default Home
