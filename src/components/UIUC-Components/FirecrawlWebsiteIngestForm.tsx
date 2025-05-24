import React, { useEffect, useState } from 'react'
import { Text, Input, TextInput, Button, Tooltip } from '@mantine/core'
import { IconWorldDownload } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { type FileUpload } from './UploadNotification'
import { IconAlertCircle } from '@tabler/icons-react'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

interface FirecrawlWebsiteIngestFormProps {
  url: string
  setUrl: (url: string) => void
  isUrlValid: boolean
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  maxUrls: string
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    variable: string,
  ) => void
  inputErrors: {
    maxUrls: { error: boolean; message: string }
    maxDepth: { error: boolean; message: string }
  }
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  setOpen: (open: boolean) => void
  depth: string
  project_name: string
}

export default function FirecrawlWebsiteIngestForm({
  url,
  setUrl,
  isUrlValid,
  handleUrlChange,
  maxUrls,
  handleInputChange,
  inputErrors,
  setUploadFiles,
  setOpen,
  depth,
  project_name,
}: FirecrawlWebsiteIngestFormProps) {
  const icon = <IconWorldDownload size={'50%'} />

  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }
    return url
  }

  const handleIngest = async () => {
    setOpen(false)

    if (inputErrors.maxUrls.error) {
      alert('Invalid max URLs input (1 to 2000)')
      return
    }

    if (inputErrors.maxDepth.error) {
      alert('Invalid depth input')
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
        if (!process.env.NEXT_PUBLIC_FIRECRAWL_API_URL) {
          throw new Error(
            'NEXT_PUBLIC_FIRECRAWL_API_URL environment variable is not defined',
          )
        }

        const requestBody = {
          url: formatUrl(url),
          limit: parseInt(maxUrls) || 50,
          maxDepth: parseInt(depth) || 2,
          project_name: project_name,
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_FIRECRAWL_API_URL}/crawl`,
          requestBody,
        )
        console.log('Response from firecrawl:', response.data)

        if (response.data.crawlId) {
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === url ? { ...file, status: 'complete' } : file,
            ),
          )
        } else {
          throw new Error('No crawl ID received from server')
        }
      } catch (error: any) {
        console.error('Error while using firecrawl:', error)
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'error' } : file,
          ),
        )
        notifications.show({
          id: 'error-notification',
          withCloseButton: true,
          closeButtonProps: { color: 'red' },
          autoClose: 12000,
          title: (
            <Text size={'lg'} className={`${montserrat_med.className}`}>
              Error during firecrawl web scraping. Please try again.
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
    } else {
      alert('Invalid URL (please include https://)')
    }
  }

  return (
    <div className="border-t border-gray-800 pt-4">
      <div className="max-h-[70vh] overflow-y-auto sm:h-auto sm:max-h-none sm:overflow-visible">
        <div className="space-y-4">
          <form
            className="w-full"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <Input
              icon={icon}
              className="w-full rounded-full"
              styles={{
                input: {
                  backgroundColor: '#1A1B1E',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  '&:focus': {
                    borderColor: '#9370DB',
                  },
                },
                wrapper: {
                  width: '100%',
                },
              }}
              placeholder="Enter URL..."
              radius="xl"
              type="url"
              value={url}
              size="lg"
              onChange={handleUrlChange}
            />

            <div className="pb-2 pt-2">
              <Tooltip
                multiline
                w={400}
                color="#15162b"
                arrowPosition="side"
                arrowSize={8}
                withArrow
                position="bottom-start"
                label="Maximum number of pages to crawl. Firecrawl supports up to 2000 pages."
              >
                <div>
                  <Text
                    style={{ color: '#C1C2C5', fontSize: '16px' }}
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Max URLs (1 to 2000)
                  </Text>
                  <TextInput
                    styles={{
                      input: {
                        backgroundColor: '#1A1B1E',
                      },
                    }}
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

            <div className="pb-2 pt-2">
              <Tooltip
                multiline
                w={400}
                color="#15162b"
                arrowPosition="side"
                arrowSize={8}
                withArrow
                position="bottom-start"
                label="Maximum crawl depth"
              >
                <div>
                  <Text
                    style={{ color: '#C1C2C5', fontSize: '16px' }}
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Crawl Depth
                  </Text>
                  <TextInput
                    styles={{
                      input: {
                        backgroundColor: '#1A1B1E',
                      },
                    }}
                    name="depth"
                    radius="md"
                    placeholder="Default 2"
                    value={depth}
                    onChange={(e) => {
                      handleInputChange(e, 'depth')
                    }}
                    error={inputErrors.maxDepth.error}
                  />
                </div>
              </Tooltip>
            </div>

            <Text style={{ color: '#C1C2C5' }} className="mt-4 text-sm italic">
              Firecrawl is optimized for speed and uses a different crawling
              strategy. It attempts to fetch all pages simultaneously for faster
              ingestion.
            </Text>
          </form>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-800 pt-2">
        <Button
          onClick={handleIngest}
          disabled={!isUrlValid}
          className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
        >
          Ingest the Website
        </Button>
      </div>
    </div>
  )
}
