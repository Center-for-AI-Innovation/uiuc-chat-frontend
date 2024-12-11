import React, { useEffect, useRef, useState } from 'react'
import { Text, Card, Button, Input, Checkbox } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import { Label } from '@radix-ui/react-label'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { type FileUpload } from './UploadNotification'
import { type QueryClient } from '@tanstack/react-query'
import Image from 'next/image'

export default function CanvasIngestForm({
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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'files',
    'pages',
    'modules',
    'syllabus',
    'assignments',
    'discussions',
  ])
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
    return regex.test(input)
  }
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])
  const handleOptionChange = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    )
  }

  const handleIngest = async () => {
    setOpen(false)
    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'canvas',
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])
      setUploadFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === url ? { ...file, status: 'ingesting' } : file,
        ),
      )
      const response = await fetch('/api/UIUC-api/ingestCanvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: courseName,
          canvas_url: url,
          selectedCanvasOptions: selectedOptions,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'complete' } : file,
          ),
        )
        queryClient.invalidateQueries({
          queryKey: ['documents', project_name],
        })
      }
      if (!response.ok) {
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'error' } : file,
          ),
        )
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      if (data && data.error) {
        throw new Error(data.error)
      }
      await new Promise((resolve) => setTimeout(resolve, 8000)) // wait a moment before redirecting
      console.log('Canvas content ingestion was successful!')
      console.log('Ingesting:', url, 'with options:', selectedOptions)
    } else {
      alert('Invalid URL (please include https://)')
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
                  <Image
                    src="/media/canvas_logo.png"
                    alt="Canvas logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold text-gray-100">
                  Canvas
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              Import content directly from your Canvas course, including
              assignments, discussions, files, and more.
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

        <DialogContent className="mx-auto h-auto w-[95%] max-w-2xl !rounded-2xl border-0 bg-[#1c1c2e] px-4 py-6 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold">
              Ingest Canvas Course
            </DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-800 pt-4">
            <div className="space-y-4">
              <div>
                <div className="break-words text-sm sm:text-base">
                  <strong>For Canvas</strong>, just enter a URL like{' '}
                  <code className="inline-flex items-center rounded-md bg-[#020307] px-2 py-1 font-mono text-xs sm:text-sm">
                    canvas.illinois.edu/courses/COURSE_CODE
                  </code>
                  , for example:{' '}
                  <span className="break-all text-purple-600">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={'https://canvas.illinois.edu/courses/37348'}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      https://canvas.illinois.edu/courses/37348
                    </NextLink>
                  </span>
                  .
                </div>
                <div className="py-3"></div>
                <Input
                  id="canvas-url"
                  icon={
                    <Image
                      src="/media/canvas_logo.png"
                      alt="Canvas Logo"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  }
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
                  placeholder="https://canvas.illinois.edu/courses/12345"
                  radius="xl"
                  type="url"
                  value={url}
                  size="lg"
                  onChange={(e) => {
                    handleUrlChange(e)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="mb-2 block text-white">
                  Select Content to Ingest
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    'Files',
                    'Pages',
                    'Modules',
                    'Syllabus',
                    'Assignments',
                    'Discussions',
                  ].map((option) => (
                    <div
                      key={option}
                      className="flex items-center space-x-2 rounded-lg bg-[#1A1B1E] p-2"
                    >
                      <Checkbox
                        id={option.toLowerCase()}
                        color="violet"
                        checked={selectedOptions.includes(option.toLowerCase())}
                        onChange={() =>
                          handleOptionChange(option.toLowerCase())
                        }
                        label={option}
                        styles={{
                          input: {
                            backgroundColor: '#1A1B1E',
                            borderColor: '#9370DB',
                            '&:checked': {
                              backgroundColor: '#9370DB',
                              borderColor: '#9370DB',
                            },
                          },
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-red-400">
                Please ensure that you have added the UIUC Chatbot as a student
                to your course on Canvas before you begin ingesting the course
                content. The bot email address is uiuc.chat@ad.uillinois.edu and
                the bot name is UIUC Course AI.
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-800 pt-2">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
            >
              Ingest Canvas Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
