// Web Scrape
import { notifications } from '@mantine/notifications'
import {
  Button,
  Input,
  Title,
  useMantineTheme,
  Tooltip,
  TextInput,
  Text,
  SegmentedControl,
  Center,
  rem,
  List,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconHome,
  IconSitemap,
  IconSubtask,
  IconWorld,
  IconWorldDownload,
} from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { LoadingSpinner } from './LoadingSpinner'
import { Montserrat } from 'next/font/google'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

interface WebScrapeProps {
  is_new_course: boolean
  courseName: string
  isDisabled: boolean
  current_user_email: string
}

const shouldShowFields = (inputUrl: string) => {
  return !(
    inputUrl.includes('coursera.org') ||
    inputUrl.includes('ocw.mit.edu') ||
    inputUrl.includes('github.com') ||
    inputUrl.includes('canvas.illinois.edu')
  )
}

const validateUrl = (url: string) => {
  const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
  const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/.+/
  const canvasRegex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
  const webScrapingRegex = /^(https?:\/\/)?.+/

  return (
    courseraRegex.test(url) ||
    mitRegex.test(url) ||
    githubRegex.test(url) ||
    canvasRegex.test(url) ||
    webScrapingRegex.test(url)
  )
}

export const WebScrape = ({
  is_new_course,
  courseName,
  isDisabled,
  current_user_email,
}: WebScrapeProps) => {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState(<IconWorldDownload size={'50%'} />)
  const [loadingSpinner, setLoadingSpinner] = useState(false)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const theme = useMantineTheme()
  const [maxUrls, setMaxUrls] = useState('50')
  const [scrapeStrategy, setScrapeStrategy] =
    useState<string>('equal-and-below')
  const [selectedCanvasOptions, setSelectedCanvasOptions] = useState<string[]>([
    'files',
    'pages',
    'modules',
    'syllabus',
    'assignments',
    'discussions',
  ])

  const handleCanvasOptionChange = (value: string) => {
    if (selectedCanvasOptions.includes(value)) {
      setSelectedCanvasOptions((prev) => prev.filter((item) => item !== value))
    } else {
      setSelectedCanvasOptions((prev) => [...prev, value])
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    variable: string,
  ) => {
    const value = e.target.value
    if (variable === 'maxUrls') {
      setMaxUrls(value)
    }
  }

  const handleSubmit = async () => {
    if (validateUrl(url)) {
      setLoadingSpinner(true)

      if (is_new_course) {
        // set course exists in new metadata endpoint
        const response = await callSetCourseMetadata(courseName, {
          course_owner: current_user_email,
          // Don't set properties we don't know about. We'll just upsert and use the defaults.
          course_admins: [],
          approved_emails_list: [],
          is_private: false,
          banner_image_s3: undefined,
          course_intro_message: undefined,
          openai_api_key: undefined,
          example_questions: undefined,
          system_prompt: undefined,
          disabled_models: undefined,
          project_description: undefined,
          documentsOnly: undefined,
          guidedLearning: undefined,
          systemPromptOnly: undefined,
          vector_search_rewrite_disabled: undefined,
        })
        if (!response) {
          throw new Error('Error while setting course metadata')
        }
      }

      let data = null
      // Make API call based on URL
      if (url.includes('coursera.org')) {
        // TODO: coursera ingest
        alert(
          'Coursera ingest is not yet automated (auth is hard). Please email rohan13@illinois.edu to do it for you',
        )
      } else if (url.includes('ocw.mit.edu')) {
        data = downloadMITCourse(url, courseName, 'local_dir') // no await -- do in background

        showToast()
      } else if (url.includes('canvas.illinois.edu/courses/')) {
        const response = await fetch('/api/UIUC-api/ingestCanvas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseName: courseName,
            canvas_url: url,
            selectedCanvasOptions: selectedCanvasOptions,
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        if (data && data.error) {
          throw new Error(data.error)
        }
        await new Promise((resolve) => setTimeout(resolve, 8000)) // wait a moment before redirecting
        console.log('Canvas content ingestion was successful!')
      } else {
        // Standard web scrape
        try {
          await scrapeWeb(
            url,
            courseName,
            maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
            scrapeStrategy,
          )
        } catch (error: any) {
          console.error('Error while scraping web:', error)
        }
        // let ingest finalize things. It should be finished, but the DB is slow.
        await new Promise((resolve) => setTimeout(resolve, 8000))
      }
    } else {
      alert('Invalid URL (please include https://)')
    }
    setLoadingSpinner(false)
    setUrl('') // clear url
    if (is_new_course) {
      await router.push(`/${courseName}/dashboard`)
    }
    // No need to refresh, our materials table auto-refreshes.
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
  })

  const validateInputs = () => {
    const errors = {
      maxUrls: { error: false, message: '' },
    }
    // Check for maxUrls
    if (!maxUrls) {
      errors.maxUrls = {
        error: true,
        message: 'Please provide an input for Max URLs',
      }
    } else if (!/^\d+$/.test(maxUrls)) {
      // Using regex to ensure the entire string is a number
      errors.maxUrls = {
        error: true,
        message: 'Max URLs should be a valid number',
      }
    } else if (parseInt(maxUrls) < 1 || parseInt(maxUrls) > 500) {
      errors.maxUrls = {
        error: true,
        message: 'Max URLs should be between 1 and 500',
      }
    }

    setInputErrors(errors)
    return !Object.values(errors).some((error) => error.error)
  }

  const showToast = () => {
    return (
      // docs: https://mantine.dev/others/notifications/

      notifications.show({
        id: 'web-scrape-toast',
        withCloseButton: true,
        onClose: () => console.log('unmounted'),
        onOpen: () => console.log('mounted'),
        autoClose: 15000,
        // position="top-center",
        title: 'Web scraping started',
        message:
          "It'll scrape in the background, just wait for the results to show up in your project (~3 minutes total).\nThis feature is stable but the web is a messy place. If you have trouble, I'd love to fix it. Just shoot me an email: rohan13@illinois.edu.",
        icon: <IconWorldDownload />,
        styles: {
          root: {
            backgroundColor: 'var(--modal-background)',
            borderColor: 'var(--modal-border)',
          },
          title: {
            color: 'var(--modal-text)',
          },
          description: {
            color: 'var(--modal-text)',
          },
          closeButton: {
            color: 'var(--modal-button)',
            '&:hover': {
              color: 'var(--modal-button-hover)',
            },
          },
        },
        loading: false,
      })
    )
  }

  const scrapeWeb = async (
    url: string | null,
    courseName: string | null,
    maxUrls: number,
    scrapeStrategy: string,
  ) => {
    try {
      if (!url || !courseName) return null
      console.log('SCRAPING', url)

      const response = await axios.post('/api/scrapeWeb', {
        url,
        courseName,
        maxUrls,
        scrapeStrategy,
      })

      console.log(
        'Response from Next.js API web scraping endpoint:',
        response.data,
      )
      return response.data
    } catch (error: any) {
      console.error('Error during web scraping:', error)

      notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        closeButtonProps: { color: 'red' },
        onClose: () => console.log('error unmounted'),
        onOpen: () => console.log('error mounted'),
        autoClose: 12000,
        title: (
          <Text size={'lg'} className={`${montserrat_med.className}`}>
            {'Error during web scraping. Please try again.'}
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-neutral-200`}>
            {error.message}
          </Text>
        ),
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: {
          backgroundColor: 'rgba(42,42,64,0.3)',
          backdropFilter: 'blur(10px)',
          borderLeft: '5px solid red',
        },
        withBorder: true,
        loading: false,
      })
    }
  }

  const downloadMITCourse = async (
    url: string | null,
    courseName: string | null,
    localDir: string | null,
  ) => {
    try {
      if (!url || !courseName || !localDir) return null
      console.log('calling downloadMITCourse')
      const response = await axios.get(`/api/UIUC-api/downloadMITCourse`, {
        params: {
          url: url,
          course_name: courseName,
          local_dir: localDir,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error during MIT course download:', error)
      return null
    }
  }

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  return (
    <>
      <Title
        order={3}
        className={`w-full text-center ${montserrat_heading.variable} pt-4 font-montserratHeading`}
      >
        OR
      </Title>
      <Title
        order={4}
        className={`w-full text-center ${montserrat_heading.variable} mt-4 font-montserratHeading`}
      >
        Web scrape any website that allows it
      </Title>

      {loadingSpinner && (
        <>
          <Input
            icon={icon}
            // I can't figure out how to change the background colors.
            className={`mt-4 w-[80%] min-w-[20rem] disabled:bg-[--background-faded] lg:w-[75%]`}
            // wrapperProps={{ borderRadius: 'xl' }}
            // styles={{ input: { backgroundColor: '#1A1B1E' } }}
            styles={{
              input: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              },
            }}
            placeholder="Enter URL..."
            radius={'xl'}
            type="url" // Set the type to 'url' to avoid thinking it's a username or pw.
            value={url}
            size={'lg'}
            disabled={isDisabled}
            onChange={(e) => {
              setUrl(e.target.value)
              if (e.target.value.includes('coursera.org')) {
                setIcon(
                  <img
                    src={'/media/coursera_logo_cutout.png'}
                    alt="Coursera Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('ocw.mit.edu')) {
                setIcon(
                  <img
                    src={'/media/mitocw_logo.jpg'}
                    alt="MIT OCW Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('github.com')) {
                setIcon(
                  <img
                    src="/media/github-mark-white.png"
                    alt="GitHub Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('canvas.illinois.edu')) {
                setIcon(
                  <img
                    src="/media/canvas_logo.png"
                    alt="Canvas Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else {
                setIcon(<IconWorldDownload />)
              }
            }}
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            rightSection={
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  if (validateInputs() && validateUrl(url)) {
                    handleSubmit()
                  }
                }}
                size="md"
                radius={'xl'}
                className={`rounded-s-md ${
                  isUrlUpdated
                    ? 'bg-[--dashboard-button]'
                    : 'border-[--dashboard-button]'
                } overflow-ellipsis text-ellipsis p-2 ${
                  isUrlUpdated
                    ? 'text-[--dashboard-button-foreground]'
                    : 'text-[--dashboard-button-foreground]'
                } min-w-[5rem] -translate-x-1 transform hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none`}
                w={`${isSmallScreen ? 'auto' : 'auto'}`}
                disabled={isDisabled}
              >
                Ingest
              </Button>
            }
            rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
          />
          <div className="pt-4" />
          {/* <Text className="mt-4 text-lg font-bold text-red-600 underline"> */}
          <Text
            style={{ color: '#C1C2C5', fontSize: '16px' }}
            className={`${montserrat_heading.variable} font-montserratHeading`}
          >
            Web scrape in progress...
          </Text>
          <Text
            style={{ color: '#C1C2C5', textAlign: 'center', maxWidth: '80%' }}
            className={`pb-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            Page refreshes upon completion. Your documents stay safe even if you
            navigate away.
          </Text>
          <LoadingSpinner />
        </>
      )}

      {!loadingSpinner && (
        <>
          <Input
            //! THIS BOX IS DUPLICATED (from above). KEEP BOTH IN SYNC. For Loading states.
            icon={icon}
            // I can't figure out how to change the background colors.
            className={`mt-4 w-[80%] min-w-[20rem] disabled:bg-[--background-faded] lg:w-[75%]`}
            // wrapperProps={{ borderRadius: 'xl' }}
            // styles={{ input: { backgroundColor: '#1A1B1E' } }}
            styles={{
              input: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              },
            }}
            placeholder="Enter URL..."
            radius={'xl'}
            type="url" // Set the type to 'url' to avoid thinking it's a username or pw.
            value={url}
            size={'lg'}
            disabled={isDisabled}
            onChange={(e) => {
              setUrl(e.target.value)
              if (e.target.value.includes('coursera.org')) {
                setIcon(
                  <img
                    src={'/media/coursera_logo_cutout.png'}
                    alt="Coursera Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('ocw.mit.edu')) {
                setIcon(
                  <img
                    src={'/media/mitocw_logo.jpg'}
                    alt="MIT OCW Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('github.com')) {
                setIcon(
                  <img
                    src="/media/github-mark-white.png"
                    alt="GitHub Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else if (e.target.value.includes('canvas.illinois.edu')) {
                setIcon(
                  <img
                    src="/media/canvas_logo.png"
                    alt="Canvas Logo"
                    style={{ height: '50%', width: '50%' }}
                  />,
                )
              } else {
                setIcon(<IconWorldDownload />)
              }
            }}
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            rightSection={
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  if (validateInputs() && validateUrl(url)) {
                    handleSubmit()
                  }
                }}
                size="md"
                radius={'xl'}
                className={`rounded-s-md ${
                  isUrlUpdated
                    ? 'bg-[--dashboard-button]'
                    : 'border-[--dashboard-button]'
                } overflow-ellipsis text-ellipsis p-2 ${
                  isUrlUpdated
                    ? 'text-[--dashboard-button-foreground]'
                    : 'text-[--dashboard-button-foreground]'
                } min-w-[5rem] -translate-x-1 transform hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none`}
                w={`${isSmallScreen ? 'auto' : 'auto'}`}
                disabled={isDisabled}
              >
                Ingest
              </Button>
            }
            rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
          />

          {/* Detailed web ingest form */}

          <form
            className="w-[80%] min-w-[20rem] lg:w-[75%]"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <div className="pb-2 pt-2">
              <Tooltip
                multiline
                w={400}
                color="#15162b"
                arrowPosition="side"
                arrowSize={8}
                withArrow
                position="bottom-start"
                label="We will attempt to visit this number of pages, but not all will be scraped if they're duplicates, broken or otherwise inaccessible."
              >
                <div>
                  <Text
                    style={{ color: '#C1C2C5', fontSize: '16px' }}
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Max URLs (1 to 500)
                  </Text>
                  <TextInput
                    styles={{ input: { backgroundColor: '#1A1B1E' } }}
                    name="maximumUrls"
                    radius="md"
                    placeholder="Default 50"
                    value={maxUrls}
                    onChange={(e) => {
                      handleInputChange(e, 'maxUrls')
                    }}
                    error={inputErrors.maxUrls.error}
                  />
                </div>
              </Tooltip>
            </div>
            {inputErrors.maxUrls.error && (
              <p style={{ color: 'red' }}>{inputErrors.maxUrls.message}</p>
            )}

            <Text
              style={{ color: '#C1C2C5', fontSize: '16px' }}
              className={`${montserrat_heading.variable} font-montserratHeading`}
            >
              Limit web crawl
            </Text>
            {/* <Text style={{ color: '#C1C2C5', fontSize: '16px' }} className={`${montserrat_paragraph.variable} font-montserratParagraph`}>Limit web crawl (from least to most inclusive)</Text> */}
            <div className="pl-3">
              <List>
                <List.Item>
                  <strong>Equal and Below:</strong> Only scrape content that
                  starts will the given URL. E.g. nasa.gov/blogs will scrape all
                  blogs like nasa.gov/blogs/new-rocket but never go to
                  nasa.gov/events.
                </List.Item>
                <List.Item>
                  <strong>Same subdomain:</strong> Crawl the entire subdomain.
                  E.g. docs.nasa.gov will grab that entire subdomain, but not
                  nasa.gov or api.nasa.gov.
                </List.Item>
                <List.Item>
                  <strong>Entire domain:</strong> Crawl as much of this entire
                  website as possible. E.g. nasa.gov also includes docs.nasa.gov
                </List.Item>
                <List.Item>
                  <span>
                    <strong>All:</strong> Start on the given URL and wander the
                    web...{' '}
                    <Text style={{ color: '#C1C2C5' }}>
                      For more detail{' '}
                      <a
                        className={
                          'text-[--dashboard-button] hover:text-[--dashboard-button-hover]'
                        }
                        href="https://docs.uiuc.chat/features/web-crawling-details"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        read the docs
                      </a>
                      .
                    </Text>
                  </span>
                </List.Item>
              </List>
            </div>

            <Text style={{ color: '#C1C2C5' }}>
              <strong>I suggest starting with Equal and Below</strong>, then
              just re-run this if you need more later.
            </Text>
            <div className="pt-2"></div>
            <SegmentedControl
              fullWidth
              orientation="vertical"
              size="sm"
              radius="md"
              value={scrapeStrategy}
              onChange={(strat) => setScrapeStrategy(strat)}
              data={[
                {
                  // Maybe use IconArrowBarDown ??
                  value: 'equal-and-below',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconSitemap
                        style={{ width: rem(16), height: rem(16) }}
                      />
                      <span>Equal and Below</span>
                    </Center>
                  ),
                },
                {
                  value: 'same-hostname',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconSubtask
                        style={{ width: rem(16), height: rem(16) }}
                      />
                      <span>Subdomain</span>
                    </Center>
                  ),
                },
                {
                  value: 'same-domain',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconHome style={{ width: rem(16), height: rem(16) }} />
                      <span>Entire domain</span>
                    </Center>
                  ),
                },
                {
                  value: 'all',
                  label: (
                    <Center style={{ gap: 10 }}>
                      <IconWorld style={{ width: rem(16), height: rem(16) }} />
                      <span>All</span>
                    </Center>
                  ),
                },
              ]}
            />
          </form>
        </>
      )}
    </>
  )
}
