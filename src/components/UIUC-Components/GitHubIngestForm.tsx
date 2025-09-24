import React, { useEffect, useState } from 'react'
import { Text, Card, Button, Input, createStyles } from '@mantine/core'
import {
  IconAlertCircle,
  IconBrandGithub,
  IconWorldDownload,
  IconArrowRight,
} from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { type FileUpload } from './UploadNotification'
import Link from 'next/link'
import { type QueryClient } from '@tanstack/react-query'
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
      color: 'var(--illinois-white)',
      backgroundColor: 'var(--illinois-orange)',
      borderRadius: '5px',
      padding: '.2rem .5rem',
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

  const handleIngest = async () => {
    setOpen(false)
    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'github',
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])
      try {
        const response = await scrapeWeb(
          url,
          project_name,
          maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
          scrapeStrategy,
        )
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

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  useEffect(() => {
    const checkIngestStatus = async () => {
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${project_name}`,
      )
      const data = await response.json()
      const docsResponse = await fetch(
        `/api/materialsTable/successDocs?course_name=${project_name}`,
      )
      const docsData = await docsResponse.json()

      // Helper function to organize docs by base URL
      const organizeDocsByBaseUrl = (
        docs: Array<{ base_url: string; url: string }>,
      ) => {
        const baseUrlMap = new Map<string, Set<string>>()

        docs.forEach((doc) => {
          if (!baseUrlMap.has(doc.base_url)) {
            baseUrlMap.set(doc.base_url, new Set())
          }
          baseUrlMap.get(doc.base_url)?.add(doc.url)
        })

        return baseUrlMap
      }

      // Helper function to update status of existing files
      const updateExistingFiles = (
        currentFiles: FileUpload[],
        docsInProgress: Array<{ base_url: string }>,
      ) => {
        return currentFiles.map((file) => {
          if (file.type !== 'github') return file

          const isStillIngesting = docsInProgress.some(
            (doc) => doc.base_url === file.name,
          )

          if (file.status === 'uploading' && isStillIngesting) {
            return { ...file, status: 'ingesting' as const }
          } else if (file.status === 'ingesting') {
            if (!isStillIngesting) {
              const isInCompletedDocs = docsData?.documents?.some(
                (doc: { url: string }) => doc.url === file.url,
              )

              if (isInCompletedDocs) {
                return { ...file, status: 'complete' as const }
              }

              return file
            }
          }
          return file
        })
      }

      // Helper function to create new file entries for additional URLs
      const createAdditionalFileEntries = (
        baseUrlMap: Map<string, Set<string>>,
        currentFiles: FileUpload[],
        docsInProgress: Array<{ base_url: string; readable_filename: string }>,
      ) => {
        const newFiles: FileUpload[] = []

        baseUrlMap.forEach((urls, baseUrl) => {
          // Only process if we have this base URL in our current files
          if (currentFiles.some((file) => file.name === baseUrl)) {
            const matchingDoc = docsInProgress.find(
              (doc) => doc.base_url === baseUrl,
            )

            const isStillIngesting = matchingDoc !== undefined

            urls.forEach((url) => {
              if (
                !currentFiles.some((file) => file.url === url) &&
                matchingDoc
              ) {
                newFiles.push({
                  name: url,
                  status: isStillIngesting ? 'ingesting' : 'complete',
                  type: 'github',
                  url: url,
                })
              }
            })
          }
        })

        return newFiles
      }

      setUploadFiles((prev) => {
        const matchingDocsInProgress =
          data?.documents?.filter((doc: { base_url: string }) =>
            prev.some((file) => file.name === doc.base_url),
          ) || []

        const baseUrlMap = organizeDocsByBaseUrl(matchingDocsInProgress)

        const additionalFiles = createAdditionalFileEntries(
          baseUrlMap,
          prev,
          matchingDocsInProgress,
        )

        const updatedFiles = updateExistingFiles(prev, matchingDocsInProgress)

        return [...updatedFiles, ...additionalFiles]
      })

      await queryClient.invalidateQueries({
        queryKey: ['documents', project_name],
      })
    }

    const interval = setInterval(checkIngestStatus, 3000)
    return () => {
      clearInterval(interval)
    }
  }, [project_name])

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
      // return error
      // throw error
    }
  }

  return (
    <motion.div layout>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setUrl('')
            setIsUrlValid(false)
            setIsUrlUpdated(false)
            setMaxUrls('50')
          }
        }}
      >
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--dashboard-background-darker]">
                  <IconBrandGithub className="h-8 w-8" />
                </div>
                <Text className="text-xl font-semibold">GitHub</Text>
              </div>
            </div>
            <Text className="mb-4 text-sm leading-relaxed text-[--dashboard-foreground-faded]">
              Import content from GitHub repositories, including documentation,
              code, and README files.
            </Text>
            <div className="mt-auto flex items-center text-sm font-bold text-[--dashboard-button]">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto max-h-[85vh] w-[95%] max-w-2xl overflow-y-auto !rounded-2xl border-0 bg-[--modal] px-4 py-6 text-[--modal-text] sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold">
              Ingest GitHub Website
            </DialogTitle>
          </DialogHeader>
          <div className="">
            <div className="">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For GitHub</strong>, just enter a URL like{' '}
                  <code className={classes.codeStyledText}>
                    github.com/USER/REPO
                  </code>
                  , for example:{' '}
                  <span>
                    <Link
                      target="_blank"
                      rel="noreferrer"
                      href={'https://github.com/langchain-ai/langchain'}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[--dashboard-button]"
                    >
                      https://github.com/langchain-ai/langchain
                    </Link>
                  </span>
                  . We&apos;ll ingest all files in the main branch. Ensure the
                  repository is public.
                </div>

                <Input
                  icon={icon}
                  className="mt-4 w-full rounded-full"
                  styles={{
                    input: {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--background-faded)',
                      borderColor: 'var(--background-dark)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:focus': {
                        borderColor: 'var(--illinois-orange)',
                      },
                    },
                    wrapper: {
                      width: '100%',
                    },
                  }}
                  placeholder="Enter URL..."
                  radius="md"
                  type="url"
                  value={url}
                  size="lg"
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-[--dashboard-button] text-[--dashboard-button-foreground] transition-colors hover:bg-[--dashboard-button-hover] disabled:bg-[--background-faded] disabled:text-[--background-dark]"
            >
              Ingest the Website
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
