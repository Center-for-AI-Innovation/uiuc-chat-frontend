import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  Switch,
  Card,
  Skeleton,
  Tooltip,
  useMantineTheme,
  Checkbox,
  Button,
  Input,
  ScrollArea,
  TextInput,
  List,
  SegmentedControl,
  Center,
  rem,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandGithub,
  IconCheck,
  IconExternalLink,
  IconHome,
  IconSitemap,
  IconSubtask,
  IconWorld,
  IconWorldDownload,
  IconX,
  IconArrowRight,
} from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import { ExternalLink } from 'tabler-icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { FileUpload } from './UploadNotification'
import Link from 'next/link'
const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function MITIngestForm({
  project_name,
  setUploadFiles,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
}): JSX.Element {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [maxUrls, setMaxUrls] = useState('50')
  const theme = useMantineTheme()
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    variable: string,
  ) => {
    const value = e.target.value
    if (variable === 'maxUrls') {
      setMaxUrls(value)
    } else if (variable === 'maxDepth') {
      // TODO: implement depth again.
      // setMaxDepth(value)
    }
  }
  const [icon, setIcon] = useState(<IconWorldDownload size={'50%'} />)
  const [scrapeStrategy, setScrapeStrategy] =
    useState<string>('equal-and-below')
  const logoRef = useRef(null) // Create a ref for the logo
  const [isEnabled, setIsEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/ocw\.mit\.edu\/.+/
    return regex.test(input)
  }
  const downloadMITCourse = async (
    url: string | null,
    courseName: string | null,
    localDir: string | null,
  ) => {
    try {
      if (!url || !courseName || !localDir) return null
      console.log('calling downloadMITCourse')
      const response = await axios.get(
        `https://flask-production-751b.up.railway.app/mit-download`,
        {
          params: {
            url: url,
            course_name: courseName,
            local_dir: localDir,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error('Error during MIT course download:', error)
      return null
    }
  }

  const handleIngest = () => {
    setOpen(false)
    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'github',
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])
      setUploadFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === url ? { ...file, status: 'ingesting' } : file,
        ),
      )
      let data = null
      data = downloadMITCourse(url, project_name, 'local_dir') // no await -- do in background
      if (
        data &&
        typeof data === 'string'
        // && 
        // data.includes('Crawl completed successfully') what is the response here?
      ) {
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'complete' } : file,
          ),
        )
      } else {
        // Handle unsuccessful crawl
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'error' } : file,
          ),
        )
        throw new Error('MIT course ingesting was not successful')
      }
      showToast()
    }
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
          "It'll scrape in the background, just wait for the results to show up in your project (~3 minutes total).\nThis feature is stable but the web is a messy place. If you have trouble, I'd love to fix it. Just shoot me an email: kvday2@illinois.edu.",
        icon: <IconWorldDownload />,
        styles: {
          root: {
            backgroundColor: theme.colors.nearlyWhite,
            borderColor: theme.colors.aiPurple,
          },
          title: {
            color: theme.colors.nearlyBlack,
          },
          description: {
            color: theme.colors.nearlyBlack,
          },
          closeButton: {
            color: theme.colors.nearlyBlack,
            '&:hover': {
              backgroundColor: theme.colors.dark[1],
            },
          },
        },
        loading: false,
      })
    )
  }
  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  const validateInputs = () => {
    const errors = {
      maxUrls: { error: false, message: '' },
      maxDepth: { error: false, message: '' },
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
  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }
    return url
  }
  const formatUrlAndMatchRegex = (url: string) => {
    // fullUrl always starts with http://. Is the starting place of the scrape.
    // baseUrl is used to construct the match statement.

    // Ensure the url starts with 'http://'
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }

    // Extract the base url including the path
    const baseUrl = (
      url.replace(/^https?:\/\//i, '').split('?')[0] as string
    ).replace(/\/$/, '') // Remove protocol (http/s), split at '?', and remove trailing slash

    const matchRegex = `http?(s)://**${baseUrl}/**`

    return {
      fullUrl: baseUrl,
      matchRegex: matchRegex,
    }
  }
  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }
  const scrapeWeb = async (
    url: string | null,
    courseName: string | null,
    maxUrls: number,
    scrapeStrategy: string,
  ) => {
    try {
      if (!url || !courseName) return null
      console.log('SCRAPING', url)

      const fullUrl = formatUrl(url)

      const postParams = {
        url: fullUrl,
        courseName: courseName,
        maxPagesToCrawl: maxUrls,
        scrapeStrategy: scrapeStrategy,
        match: formatUrlAndMatchRegex(fullUrl).matchRegex,
        maxTokens: 2000000, // basically inf.
      }
      console.log(
        'About to post to the web scraping endpoint, with params:',
        postParams,
      )

      const response = await axios.post(
        `https://crawlee-production.up.railway.app/crawl`,
        {
          params: postParams,
        },
      )
      console.log('Response from web scraping endpoint:', response.data)
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

  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setUrl('');
        }
      }}>
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c2e] to-[#2a2a40] p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/30">
                  <img
                    src="/media/mitocw_logo.jpg"
                    alt="MIT OCW Logo"
                    className="h-8 w-8 rounded-full object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold text-gray-100">
                  MIT Course
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              Import content from MIT OpenCourseWare, including lecture notes, assignments, and course materials.
            </Text>
            <div className="mt-auto flex items-center text-sm text-purple-400">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-2xl rounded-lg border-0 bg-[#1c1c2e] pt-10 px-10 text-white" style={{ padding: '50px', paddingBottom: '40px' }} >
          <DialogTitle className="text-xl font-bold">
            Ingest MIT Course
          </DialogTitle>
          <div className="space-y-4">
            <div>
              {/* <Label htmlFor="canvas-url" className="text-white">
                URL
              </Label> */}
              <div className="break-words">

                <strong>For MIT Open Course Ware</strong>, just enter a URL like{' '}
                <code style={{
                  backgroundColor: '#020307',
                  borderRadius: '5px',
                  padding: '1px 5px',
                  fontFamily: 'monospace',
                  alignItems: 'center',
                  justifyItems: 'center',
                }}>
                  ocw.mit.edu/courses/ANY_COURSE
                </code>{' '}
                , for example:{' '}
                <span className={'text-purple-600'}>
                  <Link
                    target="_blank"
                    rel="noreferrer"
                    href={
                      'https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017'
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017
                  </Link>
                </span>
                .
              </div>
              <div style={{ paddingBottom: '12px' }}></div>
              <Input
                icon={<img
                  src={'/media/mitocw_logo.jpg'}
                  alt="MIT OCW Logo"
                  style={{ height: '50%', width: '50%' }}
                />}
                // I can't figure out how to change the background colors.
                className={`mt-4 w-[100%] min-w-[25rem] disabled:bg-purple-200 lg:w-[100%]`}
                // wrapperProps={{ borderRadius: 'xl' }}
                // styles={{ input: { backgroundColor: '#1A1B1E' } }}
                styles={{
                  input: {
                    backgroundColor: '#1A1B1E',
                    // paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    '&:focus': {
                      borderColor: '#9370DB', // Change border color to a lighter purple only on focus
                    },
                  },
                }}
                placeholder="Enter URL..."
                radius={'xl'}
                type="url" // Set the type to 'url' to avoid thinking it's a username or pw.
                value={url}
                size={'lg'}
                onChange={(e) => {
                  handleUrlChange(e)
                }}
              // disabled={isDisabled}

              // onKeyPress={(event) => {
              //   if (event.key === 'Enter') {
              //     handleSubmit()
              //   }
              // }}
              // rightSection={
              // <Button
              //   onClick={(e) => {
              //     e.preventDefault()
              //     if (validateInputs() && validateUrl(url)) {
              //       handleSubmit()
              //     }
              //   }}
              //   size="md"
              //   radius={'xl'}
              //   className={`rounded-s-md ${
              //     isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'
              //   } overflow-ellipsis text-ellipsis p-2 ${
              //     isUrlUpdated ? 'text-white' : 'text-gray-500'
              //   } min-w-[5rem] -translate-x-1 transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
              //   w={`${isSmallScreen ? 'auto' : 'auto'}`}
              //   disabled={isDisabled}
              // >
              //   Ingest
              // </Button>
              // }
              // rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
              />
            </div>
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
            >
              Ingest the Website
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
