'use client'

import React, { useState, useEffect } from 'react'
import { Card, Text, Button, Tooltip } from '@mantine/core'
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconFileTypePdf,
  IconCode,
  IconFileTypeTxt,
  IconFileTypeDocx,
  IconFileTypePpt,
  IconFileTypeXls,
  IconVideo,
  IconPhoto,
  IconMusic,
  IconWorld,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useQuery } from '@tanstack/react-query'

export interface FileUpload {
  name: string
  status: 'uploading' | 'ingesting' | 'complete' | 'error'
  type: 'document' | 'webscrape' | 'canvas' | 'github' | 'mit'
  url?: string
  error?: string
  isBaseUrl?: boolean
}

interface FailedDocumentsResponse {
  final_docs: Array<{
    id: string | number
    course_name: string
    readable_filename: string
    s3_path: string
    url: string
    base_url: string
    created_at: string
    error: string
  }>
  total_count: number
  recent_fail_count: number
}

interface UploadNotificationProps {
  files: FileUpload[]
  onClose: () => void
  // onCancel: () => void
  projectName: string
}

function UploadNotificationContent({
  files,
  onClose,
  projectName,
}: UploadNotificationProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentFiles, setCurrentFiles] = useState<FileUpload[]>([])
  const { data: failedDocuments } = useQuery<FailedDocumentsResponse>({
    queryKey: ['failedDocuments', projectName, 1, '', '', 'created_at', 'desc'],
    queryFn: async () => {
      // FIXME match queryKey parameters
      const from = 0
      const to = 19 // 20 results per page, adjust as needed
      const filter_key = ''
      const filter_value = ''
      const sort_column = 'created_at'
      const sort_direction = 'desc'

      const response = await fetch(
        `/api/materialsTable/fetchFailedDocuments?from=${from}&to=${to}&course_name=${projectName}&filter_key=${filter_key}&filter_value=${filter_value}&sort_column=${sort_column}&sort_direction=${sort_direction}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch failed documents')
      }
      return response.json()
    },
    staleTime: 10000,
    enabled: !!projectName,
  })
  useEffect(() => {
    if (files && Array.isArray(files)) {
      setCurrentFiles((prevFiles) => {
        const updatedFiles = files.map((newFile) => {
          const existingFile = prevFiles.find((f) => f.name === newFile.name)
          if (existingFile) {
            if (existingFile.status !== newFile.status) {
              return {
                ...existingFile,
                status: newFile.status,
                url: newFile.url,
                error: newFile.error,
              }
            }
            return existingFile
          }
          return newFile
        })

        if (failedDocuments?.final_docs) {
          return files.map((file) => {
            const failedDoc = failedDocuments.final_docs.find(
              (doc) =>
                doc.readable_filename === file.name || doc.url === file.url,
            )

            if (failedDoc) {
              return {
                ...file,
                status: 'error' as const,
                error: failedDoc.error,
              }
            }
            return file
          })
        }
        return updatedFiles
      })
    }
  }, [files, failedDocuments])

  useEffect(() => {
    const allFilesDone =
      currentFiles.length > 0 &&
      currentFiles.every(
        (file) => file.status === 'complete' || file.status === 'error',
      )

    if (allFilesDone) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentFiles, onClose])

  const allComplete =
    currentFiles.length > 0 &&
    currentFiles.every((file) => file.status === 'complete')

  const toggleMinimize = () => setIsMinimized(!isMinimized)

  const getFileIcon = (fileType: string) => {
    const iconProps = {
      size: 20,
      stroke: 1.5,
      className: 'flex-shrink-0',
    }

    /* //changed to match the same colors as the upload maters section in largeDropzone
        { icon: IconFileTypePdf, label: 'PDF', color: 'text-red-500' },
        { icon: IconFileTypeDocx, label: 'Word', color: 'text-blue-500' },
        { icon: IconFileTypePpt, label: 'PPT', color: 'text-orange-500' },
        { icon: IconFileTypeXls, label: 'Excel', color: 'text-green-500' },
        { icon: IconVideo, label: 'Video', color: 'text-purple-500' },
        { icon: IconPhoto, label: 'Image', color: 'text-pink-500' },
        { icon: IconMusic, label: 'Audio', color: 'text-yellow-500' },
        { icon: IconCode, label: 'Code', color: 'text-cyan-500' },
        { icon: IconFileTypeTxt, label: 'Text', color: 'text-white' }
    */
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <IconFileTypePdf {...iconProps} className="text-red-500" />
      case 'doc':
      case 'docx':
        return <IconFileTypeDocx {...iconProps} className="text-blue-500" />
      case 'ppt':
      case 'pptx':
        return <IconFileTypePpt {...iconProps} className="text-orange-500" />
      case 'xls':
      case 'xlsx':
        return <IconFileTypeXls {...iconProps} className="text-green-500" />
      case 'mp4':
      case 'mov':
      case 'avi':
        return <IconVideo {...iconProps} className="text-purple-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <IconPhoto {...iconProps} className="text-pink-500" />
      case 'mp3':
      case 'wav':
        return <IconMusic {...iconProps} className="text-yellow-500" />
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
        return <IconCode {...iconProps} className="text-cyan-500" />
      default:
        return <IconFileTypeTxt {...iconProps} className="text-white" />
    }
  }

  const truncateText = (text: string, maxLength = 20) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const getStatusMessage = (
    status: FileUpload['status'],
    url?: string,
    type?: string,
    isBaseUrl?: boolean,
  ) => {
    // if (url) return truncateText(url, 35)

    switch (status) {
      case 'uploading':
        return url && isBaseUrl
          ? 'Crawling this website...'
          : type === 'webscrape' || type === 'github'
            ? 'Crawling this website...'
            : 'Uploading to secure storage...'
      case 'ingesting':
        return url && isBaseUrl
          ? 'Crawling this website...'
          : 'Processing for chat...'
      case 'complete':
        return 'Ready for chat'
      case 'error':
        return 'Upload failed'
      default:
        return status
    }
  }

  if (currentFiles.length === 0) {
    return null
  }

  return (
    <Card
      shadow="sm"
      padding={0}
      radius="md"
      className={`fixed bottom-4 right-4 z-50 w-[320px] overflow-hidden border border-[--modal-border] bg-[--modal] shadow-xl shadow-black/25 md:w-[420px] ${montserrat_paragraph.variable}`}
    >
      <div className="flex items-center justify-between border-b border-[--modal-border] bg-[--modal-dark] px-5 py-4 text-[--modal-text]">
        <div className="flex flex-col gap-1">
          <Text
            size="sm"
            weight={600}
            className={`${montserrat_heading.variable} font-montserratHeading`}
          >
            {allComplete
              ? `${currentFiles.length} document${currentFiles.length > 1 ? 's' : ''} ready for chat`
              : `Processing ${currentFiles.length} document${currentFiles.length > 1 ? 's' : ''}`}
          </Text>
          <Text
            size="xs"
            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
            component="pre"
          >
            {currentFiles.some((file) => file.status === 'error')
              ? 'If upload failed, please try again and let us know!'
              : currentFiles.some((file) => file.status === 'uploading')
                ? 'Please stay on this page while files are uploading'
                : currentFiles.some((file) => file.status === 'ingesting')
                  ? 'Files are being processed for chat\nYou can leave this page if you want'
                  : 'All files processed\nContinue to chat'}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="subtle"
            color="gray"
            compact
            onClick={toggleMinimize}
            className="h-8 w-8 rounded-md p-0 text-[--modal-button] hover:bg-[--background-dark] hover:text-[--modal-button-text-hover]"
          >
            {isMinimized ? (
              <IconChevronUp size={18} />
            ) : (
              <IconChevronDown size={18} />
            )}
          </Button>
          <Button
            variant="subtle"
            color="gray"
            compact
            onClick={onClose}
            className="h-8 w-8 rounded-md p-0 text-[--modal-button] hover:bg-[--background-dark] hover:text-[--modal-button-text-hover]"
          >
            <IconX size={18} />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-h-[300px] overflow-y-auto px-5 py-4">
          <AnimatePresence>
            {currentFiles.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-3 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center text-[--foreground-faded]">
                    {file.type === 'webscrape' ? (
                      <IconWorld size={18} />
                    ) : file.name ? (
                      getFileIcon(file.name.split('.').pop() || '')
                    ) : (
                      getFileIcon('')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text
                      size="sm"
                      className={`truncate font-medium text-[--modal-text] ${montserrat_paragraph.variable} font-montserratParagraph`}
                      title={file.name}
                    >
                      {file.name ? truncateText(file.name, 30) : file.name}
                    </Text>
                    <Text
                      size="xs"
                      className={`truncate text-[--modal-text] ${montserrat_paragraph.variable} font-montserratParagraph`}
                      title={getStatusMessage(file.status)}
                    >
                      {getStatusMessage(
                        file.status,
                        file.url,
                        file.type,
                        file.isBaseUrl,
                      )}
                    </Text>
                  </div>
                  <div className="ml-2 flex items-center">
                    {(file.status === 'uploading' ||
                      file.status === 'ingesting') && (
                      <Tooltip
                        label={
                          file.status === 'uploading'
                            ? 'Uploading to secure storage'
                            : 'Processing for chat'
                        }
                        classNames={{
                          tooltip: `${montserrat_paragraph.variable} font-montserratParagraph`,
                        }}
                      >
                        <LoadingSpinner size="xs" />
                      </Tooltip>
                    )}

                    {file.status === 'complete' && (
                      <Tooltip
                        label="Ready for chat"
                        classNames={{
                          tooltip: `${montserrat_paragraph.variable} font-montserratParagraph`,
                        }}
                      >
                        <IconCheck
                          size={18}
                          className="text-[--modal-button]"
                        />
                      </Tooltip>
                    )}
                    {file.status === 'error' && (
                      <Tooltip
                        label="Upload failed"
                        classNames={{
                          tooltip: `${montserrat_paragraph.variable} font-montserratParagraph`,
                        }}
                      >
                        <IconX size={18} className="text-[--error]" />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  )
}

export default function UploadNotification(props: UploadNotificationProps) {
  return <UploadNotificationContent {...props} />
}
