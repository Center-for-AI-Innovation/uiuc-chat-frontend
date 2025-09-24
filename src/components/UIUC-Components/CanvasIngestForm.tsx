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
  const { t } = useTranslation('common')
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
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[--dashboard-background-faded] p-6 text-[--dashboard-foreground] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[--dashboard-background-darker]">
                  <Image
                    src="/media/canvas_logo.png"
                    alt="Canvas logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold">{t('canvas_ingest.title')}</Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-[--dashboard-foreground-faded]">
              {t('canvas_ingest.description')}
            </Text>
            <div className="mt-auto flex items-center text-sm font-bold text-[--dashboard-button]">
              <span>{t('upload_cards.configure_import')}</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto h-auto max-h-[85vh] w-[95%] max-w-2xl overflow-y-auto !rounded-2xl border-0 bg-[--modal] px-4 py-6 text-[--modal-text] sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-1 text-left text-xl font-bold">
              {t('canvas_ingest.import_content')}
            </DialogTitle>
          </DialogHeader>

          <Alert
            icon={<IconAlertTriangle size={18} />}
            color="red"
            title={t('canvas_ingest.permission_required')}
            className="mb-4 bg-[--background-faded] text-[--illinois-orange]"
            styles={{
              message: {
                color: 'var(--modal-text)',
              },
            }}
          >
            <span className="font-semibold">
              {t('canvas_ingest.permission_instructions')}{' '}
              <NextLink
                href="https://canvas.illinois.edu/"
                target="_blank"
                rel="noreferrer"
                className="text-[--link] hover:underline"
              >
                https://canvas.illinois.edu
              </NextLink>
            </span>
            <div className="mt-2">
              • {t('canvas_ingest.bot_email')}{' '}
              <span className="font-mono text-[--illinois-orange]">
                {t('canvas_ingest.bot_email_address')}
              </span>
              <br />• Bot name:{' '}
              <span className="font-mono text-[--illinois-orange]">
                {t('canvas_ingest.bot_name_value')}
              </span>
            </div>
            <div className="mt-2 text-xs italic">
              {t('canvas_ingest.permission_note')}
            </div>
          </Alert>

          <div className="mb-4 overflow-hidden rounded-md">
            <div className="relative h-0 pb-[58.5%]">
              <iframe
                className="absolute left-0 top-0 h-full w-full rounded-md"
                src="https://www.youtube.com/embed/OOy0JD0Gf9g"
                title={t('canvas_ingest.tutorial_title') || 'Canvas Connection Tutorial'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="">
            <div>
              <div className="text-md break-words">
                {t('canvas_ingest.enter_canvas_url')}{' '}
                <code className="inline-flex items-center rounded-md bg-[--illinois-orange] px-2 py-1 font-mono text-xs text-[--illinois-white] sm:text-sm">
                  {t('canvas_ingest.canvas_url_example')}
                </code>
                ,
                <div>
                  {t('canvas_ingest.for_example')}{' '}
                  <span className="break-all text-[--link]">
                    <NextLink
                      target="_blank"
                      rel="noreferrer"
                      href={'https://canvas.illinois.edu/courses/37348'}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      {t('canvas_ingest.canvas_url_sample')}
                    </NextLink>
                  </span>
                  .
                </div>
              </div>

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
                placeholder={t('canvas_ingest.canvas_url_placeholder') as unknown as string}
                radius="md"
                type="url"
                value={url}
                size="lg"
                onChange={(e) => {
                  handleUrlChange(e)
                }}
              />
            </div>

            <div className="mt-4">
              <Label className="block ">{t('canvas_ingest.select_content_to_import')}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  t('canvas_ingest.files'),
                  t('canvas_ingest.pages'),
                  t('canvas_ingest.modules'),
                  t('canvas_ingest.syllabus'),
                  t('canvas_ingest.assignments'),
                  t('canvas_ingest.discussions'),
                ].map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 rounded-lg bg-[--background-faded] p-2 text-[--foreground]"
                  >
                    <Checkbox
                      id={option.toString().toLowerCase()}
                      checked={selectedOptions.includes(option.toString().toLowerCase())}
                      onChange={() => handleOptionChange(option.toString().toLowerCase())}
                      label={option}
                      styles={{
                        input: {
                          backgroundColor: 'var(--background-faded)',
                          borderColor: 'var(--background-dark)',
                          '&:checked': {
                            backgroundColor: 'var(--button)',
                            borderColor: 'var(--button)',
                          },
                        },
                        label: {
                          color: 'var(--foreground)',
                        },
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-[--dashboard-button] text-[--dashboard-button-foreground] transition-colors hover:bg-[--dashboard-button-hover] disabled:bg-[--background-faded] disabled:text-[--background-dark]"
            >
              {t('canvas_ingest.import_content_button') || t('canvas_ingest.import_content', { defaultValue: 'Import Canvas Content' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
