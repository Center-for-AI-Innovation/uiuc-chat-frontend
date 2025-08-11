import React, { useEffect, useMemo, useState } from 'react'
import {
  Text,
  Card,
  Tooltip,
  Button,
  Input,
  TextInput,
  List,
  SegmentedControl,
  Center,
  rem,
} from '@mantine/core'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import {
  IconAlertCircle,
  IconHome,
  IconSitemap,
  IconSubtask,
  IconWorld,
  IconWorldDownload,
  IconArrowRight,
} from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { montserrat_heading } from 'fonts'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { type FileUpload } from './UploadNotification'
import { type QueryClient } from '@tanstack/react-query'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function WebsiteIngestForm({
                                            project_name,
                                            setUploadFiles,
                                            queryClient,
                                          }: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
}): JSX.Element {
  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

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

      if (value && /^\d+$/.test(value)) {
        const numValue = parseInt(value)
        if (numValue >= 1 && numValue <= 500) {
          setInputErrors((prev) => ({
            ...prev,
            maxUrls: { error: false, message: '' },
          }))
          return
        }
      }

      let errorMessage = ''
      if (!value) {
        errorMessage = 'Please provide an input for Max URLs'
      } else if (!/^\d+$/.test(value)) {
        errorMessage = 'Max URLs should be a valid number'
      } else {
        const numValue = parseInt(value)
        if (numValue < 1 || numValue > 500) {
          errorMessage = 'Max URLs should be between 1 and 500'
        }
      }

      setInputErrors((prev) => ({
        ...prev,
        maxUrls: {
          error: !!errorMessage,
          message: errorMessage,
        },
      }))
    }
  }
  const icon = <IconWorldDownload size={'50%'} />
  const [scrapeStrategy, setScrapeStrategy] =
    useState<string>('equal-and-below')
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^(https?:\/\/)?.+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  const handleIngest = async () => {
    setOpen(false)

    if (inputErrors.maxUrls.error) {
      alert('Invalid max URLs input (1 to 500)')
      return
    }

    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'webscrape',
        url: url,
        isBaseUrl: true,
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])

      try {
        const response = await scrapeWeb(
          url,
          project_name,
          maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
          scrapeStrategy,
        )
      } catch (error: unknown) {
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
          if (file.type !== 'webscrape') return file

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

              // If not in completed docs, keep as 'ingesting'
              // The crawling might still be in progress even if not in docsInProgress
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
                  type: 'webscrape',
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
            setInputErrors((prev) => ({
              ...prev,
              maxUrls: { error: false, message: '' },
            }))
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
                  <IconWorldDownload className="h-8 w-8" />
                </div>
                <Text className="text-xl font-semibold text-[--dashboard-foreground]">
                  Website
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-[--dashboard-foreground-faded]">
              Import content from any website by providing the URL. Supports
              recursive crawling with customizable depth.
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
            <DialogTitle className="mb-2 text-left text-xl font-bold">
              Ingest Website
            </DialogTitle>
          </DialogHeader>
          <div className="">
            <div className="max-h-[70vh] overflow-y-auto sm:h-auto sm:max-h-none sm:overflow-visible">
              <div className="space-y-4">
                <form
                  className="w-full"
                  onSubmit={(event) => {
                    event.preventDefault()
                  }}
                >
                  {useIllinoisChatConfig && <Text
                    style={{ color: 'red', fontSize: '16px' }}
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Coming soon! Contact us if interested.
                  </Text>}

                  <Input
                    icon={icon}
                    className="w-full rounded-full"
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
                    disabled={useIllinoisChatConfig} // Disable if using Illinois Chat config
                  />
                  <div className="pb-2 pt-2">
                    <Tooltip
                      multiline
                      w={400}
                      color="var(--tooltip-background)"
                      arrowPosition="side"
                      arrowSize={8}
                      withArrow
                      position="bottom-start"
                      label="We will attempt to visit this number of pages, but not all will be scraped if they're duplicates, broken or otherwise inaccessible."
                      styles={{
                        tooltip: {
                          color: 'var(--tooltip)',
                          backgroundColor: 'var(--tooltip-background)',
                        },
                      }}
                    >
                      <div className="mt-4">
                        <Text
                          style={{ fontSize: '16px' }}
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                        >
                          Max URLs (1 to 500)
                        </Text>

                        <TextInput
                          name="maximumUrls"
                          radius="md"
                          placeholder="Default 50"
                          value={maxUrls}
                          onChange={(e) => {
                            handleInputChange(e, 'maxUrls')
                          }}
                          error={inputErrors.maxUrls.error}
                          className="mt-2 w-full rounded-full"
                          styles={{
                            input: {
                              color: 'var(--foreground)',
                              backgroundColor:
                                'var(--background-faded) !important',
                              borderColor: 'var(--background-dark)',
                              padding:
                                'calc(var(--padding) * 1.5) calc(var(--padding) * .75)',
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
                          disabled={useIllinoisChatConfig}
                        />
                      </div>
                    </Tooltip>
                  </div>
                  {inputErrors.maxUrls.error && (
                    <p style={{ color: 'red' }}>
                      {inputErrors.maxUrls.message}
                    </p>
                  )}
                  {inputErrors.maxDepth.error && (
                    <p style={{ color: 'red' }}>
                      {inputErrors.maxDepth.message}
                    </p>
                  )}

                  <Text
                    style={{ fontSize: '16px' }}
                    className={`${montserrat_heading.variable} mt-4 font-montserratHeading`}
                  >
                    Limit web crawl
                  </Text>
                  <div className="mt-2 pl-3">
                    <List className="text-[--modal-text]">
                      <List.Item>
                        <strong>Equal and Below:</strong> Only scrape content
                        that starts will the given URL. E.g. nasa.gov/blogs will
                        scrape all blogs like nasa.gov/blogs/new-rocket but
                        never go to nasa.gov/events.
                      </List.Item>
                      <List.Item>
                        <strong>Same subdomain:</strong> Crawl the entire
                        subdomain. E.g. docs.nasa.gov will grab that entire
                        subdomain, but not nasa.gov or api.nasa.gov.
                      </List.Item>
                      <List.Item>
                        <strong>Entire domain:</strong> Crawl as much of this
                        entire website as possible. E.g. nasa.gov also includes
                        docs.nasa.gov
                      </List.Item>
                      <List.Item>
                        <span>
                          <strong>All:</strong> Start on the given URL and
                          wander the web...{' '}
                          <Text>
                            For more detail{' '}
                            <a
                              className={'font-bold text-[--link]'}
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

                  <Text className="mt-4">
                    <strong>I suggest starting with Equal and Below</strong>,
                    then just re-run this if you need more later.
                  </Text>

                  <SegmentedControl
                    fullWidth
                    orientation="vertical"
                    size="sm"
                    radius="none"
                    value={scrapeStrategy}
                    onChange={(strat) => setScrapeStrategy(strat)}
                    className="mt-4 bg-[--background-faded]"
                    styles={{
                      indicator: {
                        color: 'var(--dashboard-button-foreground)',
                        backgroundColor: 'var(--dashboard-button)',
                      },
                      label: {
                        color: 'var(--foreground)',

                        '&:hover': {
                          color: 'var(--dashboard-button)',
                        },
                      },
                    }}
                    data={[
                      {
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
                            <IconHome
                              style={{ width: rem(16), height: rem(16) }}
                            />
                            <span>Entire domain</span>
                          </Center>
                        ),
                      },
                      {
                        value: 'all',
                        label: (
                          <Center style={{ gap: 10 }}>
                            <IconWorld
                              style={{ width: rem(16), height: rem(16) }}
                            />
                            <span>All</span>
                          </Center>
                        ),
                      },
                    ]}
                  />
                </form>
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
