import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  Card,
  useMantineTheme,
  Button,
  Input,
  Image,
} from '@mantine/core'
import { IconWorldDownload, IconArrowRight } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import NextLink from 'next/link'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { FileUpload } from './UploadNotification'
import { QueryClient } from '@tanstack/react-query'
const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function MITIngestForm({
  project_name,
  setUploadFiles,
  queryClient,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
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
    } else {
      alert('Invalid URL (please include https://)')
    }
  }
  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }
    return url
  }
  const formatUrlAndMatchRegex = (url: string) => {
    // fullUrl always starts with http://. Is the starting place of the scrape.
    // baseUrl is used to construct the match statement.

    // Ensure the url starts with 'http://'ff
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
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c2e] to-[#2a2a40] p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
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
              Import content from MIT OpenCourseWare, including lecture notes,
              assignments, and course materials.
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

        <DialogContent className="mx-auto h-auto w-[95%] max-w-2xl rounded-2xl border-0 bg-[#1c1c2e] px-4 py-6 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-xl font-bold">
              Ingest MIT Course
            </DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-800 pt-4">
            <div className="space-y-4">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For MIT Open Course Ware</strong>, just enter a URL
                  like{' '}
                  <code className="inline-flex items-center rounded-md bg-[#020307] px-2 py-1 font-mono text-xs sm:text-sm">
                    ocw.mit.edu/courses/ANY_COURSE
                  </code>{' '}
                  , for example:{' '}
                  <span className="break-all text-purple-600">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={
                        'https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017'
                      }
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017
                    </NextLink>
                  </span>
                  .
                </div>
                <div className="py-3"></div>
                <Input
                  icon={
                    <Image
                      src="/media/mitocw_logo.jpg"
                      alt="MIT OCW Logo"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  }
                  className="w-full"
                  styles={{
                    input: {
                      backgroundColor: '#1A1B1E',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      borderRadius: '1rem',
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
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-800 pt-2">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
            >
              Ingest MIT Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
