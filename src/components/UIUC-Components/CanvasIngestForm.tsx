import React, { useEffect, useRef, useState } from 'react'
import { Text, Card, Button, Input, Checkbox, Alert } from '@mantine/core'
import { IconArrowRight, IconAlertTriangle } from '@tabler/icons-react'
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
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('common');

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
                  {t('canvas')}
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              {t('import_canvas_description')}
            </Text>
            <div className="mt-auto flex items-center text-sm text-purple-400">
              <span>{t('configure_import')}</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto max-h-[85vh] w-[95%] max-w-2xl overflow-y-auto !rounded-2xl border-0 bg-[#1c1c2e] px-4 py-6 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-1 text-left text-xl font-bold">
              {t('import_canvas_content')}
            </DialogTitle>
          </DialogHeader>

          <Alert
            icon={<IconAlertTriangle size={18} />}
            color="red"
            title={t('canvas_permission_required') || ''}
            className="mb-4 border border-red-500/50 bg-red-900/20"
          >
            <span className="font-semibold">
              {t('canvas_permission_instructions')}
              <NextLink
                href="https://canvas.illinois.edu/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                https://canvas.illinois.edu
              </NextLink>
            </span>
            <div className="mt-1">
              • {t('bot_email')}{' '}
              <span className="font-mono text-yellow-300">
                {t('bot_email_address')}
              </span>
              <br />• {t('bot_name')}{' '}
              <span className="font-mono text-yellow-300">{t('bot_name_value')}</span>
            </div>
            <div className="mt-1 text-xs italic">
              {t('canvas_permission_note')}
            </div>
          </Alert>

          <div className="mb-4 overflow-hidden rounded-md">
            <div className="relative h-0 pb-[58.5%]">
              <iframe
                className="absolute left-0 top-0 h-full w-full rounded-md"
                src="https://www.youtube.com/embed/OOy0JD0Gf9g"
                title="Canvas Connection Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-md break-words">
                {t('enter_canvas_url')}
                <code className="inline-flex items-center rounded-md bg-[#020307] px-2 py-1 font-mono text-xs sm:text-sm">
                  {t('canvas_url_example')}
                </code>
                , {t('for_example')}
                <span className="break-all text-purple-600">
                  <NextLink
                    target="_blank"
                    rel="noreferrer"
                    href={t('canvas_url_sample') || ''}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {t('canvas_url_sample') || ''}
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
                placeholder={t('canvas_url_placeholder') || ''}
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
                {t('select_content_to_import')}
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  t('files'),
                  t('pages'),
                  t('modules'),
                  t('syllabus'),
                  t('assignments'),
                  t('discussions'),
                ].map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 rounded-lg bg-[#1A1B1E] p-2"
                  >
                    <Checkbox
                      id={option.toLowerCase()}
                      color="violet"
                      checked={selectedOptions.includes(option.toLowerCase())}
                      onChange={() => handleOptionChange(option.toLowerCase())}
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
          </div>
          <Button
            onClick={handleIngest}
            disabled={!isUrlValid}
            className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
          >
            {t('import_canvas_content')}
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
