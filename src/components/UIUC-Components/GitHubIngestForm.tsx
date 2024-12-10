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
  createStyles,
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
import { QueryClient } from '@tanstack/react-query'
const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function GitHubIngestForm({
  project_name,
  setUploadFiles,
  queryClient,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
}): JSX.Element {
  const useStyles = createStyles((theme) => ({
    // For Logos
    logos: {
      // width: '30%',
      aspectRatio: '3/2',
      objectFit: 'contain',
      width: '80px',
    },

    smallLogos: {
      // width: '30%',
      aspectRatio: '1/1',
      objectFit: 'contain',
      width: '45px',
    },

    codeStyledText: {
      backgroundColor: '#020307',
      borderRadius: '5px',
      padding: '1px 5px',
      fontFamily: 'monospace',
      alignItems: 'center',
      justifyItems: 'center',
    },

    // For Accordion
    root: {
      borderRadius: theme.radius.lg,
      paddingLeft: 25,
      width: '400px',
      // outline: 'none',
      paddingTop: 20,
      paddingBottom: 20,

      '&[data-active]': {
        paddingTop: 20,
      },
    },
    control: {
      borderRadius: theme.radius.lg,
      // outline: '0.5px solid ',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // 20% white on hover
      },
    },
    content: {
      borderRadius: theme.radius.lg,
    },
    panel: {
      borderRadius: theme.radius.lg,
    },
    item: {
      backgroundColor: 'bg-transparent',
      // border: `${rem(1)} solid transparent`,
      border: `solid transparent`,
      borderRadius: theme.radius.lg,
      position: 'relative',
      // zIndex: 0,
      transition: 'transform 150ms ease',
      outline: 'none',

      '&[data-active]': {
        transform: 'scale(1.03)',
        backgroundColor: '#15162b',
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadows.xl,
      },
      '&:hover': {
        backgroundColor: 'bg-transparent',
      },
    },

    chevron: {
      '&[data-rotate]': {
        transform: 'rotate(180deg)',
      },
    },
  }))
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [maxUrls, setMaxUrls] = useState('50')
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
  const [open, setOpen] = useState(false)
  const { classes, theme } = useStyles()
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/(www\.)?github\.com\/.+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })
  const handleIngest = async () => {
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
      try {
        const response = await scrapeWeb(
          url,
          project_name,
          maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
          scrapeStrategy,
        )
        if (
          response &&
          typeof response === 'string' &&
          response.includes('Crawl completed successfully')
        ) {
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === url ? { ...file, status: 'complete' } : file,
            ),
          )
          await queryClient.invalidateQueries({
            queryKey: ['documents', project_name]
          })
        } else {
          // Handle unsuccessful crawl
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === url ? { ...file, status: 'error' } : file,
            ),
          )
          throw new Error('Crawl was not successful')
        }
      } catch (error: any) {
        console.error('Error while scraping web:', error)
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'error' } : file,
          ),
        )
        // Remove the timeout since we're handling errors properly now
      }
    } else {
      alert('Invalid URL (please include https://)')
    }

    // let ingest finalize things. It should be finished, but the DB is slow.
    await new Promise((resolve) => setTimeout(resolve, 8000))
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
      // return error
      // throw error
    }
  }

  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setUrl('');
          setIsUrlValid(false)
          setIsUrlUpdated(false)
          setMaxUrls('50')
        }
      }}>
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c2e] to-[#2a2a40] p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/30">
                  <IconBrandGithub className="h-8 w-8" />
                </div>
                <Text className="text-xl font-semibold text-gray-100">
                  GitHub
                </Text>
              </div>
            </div>
            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              Import content from GitHub repositories, including documentation,
              code, and README files.
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

        <DialogContent
          className="max-w-2xl rounded-lg border-0 bg-[#1c1c2e] pt-10 px-10 text-white"
          style={{
            padding: '50px',
            paddingBottom: '40px'  // Changed from '20px' to '40px' to match MIT form
          }}
        >
          <DialogTitle className="text-xl font-bold">
            Ingest GitHub Website
          </DialogTitle>
          <div className="space-y-4">
            <div>
              {/* <Label htmlFor="canvas-url" className="text-white">
                  URL
                </Label> */}
              <strong>For GitHub</strong>, just enter a URL like{' '}
              <code className={classes.codeStyledText}>
                github.com/USER/REPO
              </code>
              , for example:{' '}
              <span className={'text-purple-600'}>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={'https://github.com/langchain-ai/langchain'}
                  onClick={(e) => e.stopPropagation()}
                >
                  https://github.com/langchain-ai/langchain
                </Link>
              </span>
              . We&apos;ll ingest all files in the main branch. Ensure the
              repository is public.
              <div style={{ paddingBottom: '12px' }}></div>
              <Input
                icon={<img
                  src="/media/github-mark-white.png"
                  alt="GitHub Logo"
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
                // disabled={isDisabled}
                onChange={(e) => {
                  handleUrlChange(e)
                  setIcon(
                    <img
                      src="/media/github-mark-white.png"
                      alt="GitHub Logo"
                      style={{ height: '50%', width: '50%' }}
                    />,
                  )
                }}
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
    </motion.div >
  )
}

