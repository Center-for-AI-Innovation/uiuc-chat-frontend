'use client'

import React, { useState, useEffect } from 'react'
import { Card, Text, Button, Tooltip, ActionIcon } from '@mantine/core'
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
  IconCopy,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useQuery } from '@tanstack/react-query'
import { showNotification } from '@mantine/notifications'

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

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <IconFileTypePdf {...iconProps} className="text-[#FF4B4B]" />
      case 'doc':
      case 'docx':
        return <IconFileTypeDocx {...iconProps} className="text-[#4B7BFF]" />
      case 'ppt':
      case 'pptx':
        return <IconFileTypePpt {...iconProps} className="text-[#FF8F4B]" />
      case 'xls':
      case 'xlsx':
        return <IconFileTypeXls {...iconProps} className="text-[#4BFF4B]" />
      case 'mp4':
      case 'mov':
      case 'avi':
        return <IconVideo {...iconProps} className="text-[#B44BFF]" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <IconPhoto {...iconProps} className="text-[#FF4B8F]" />
      case 'mp3':
      case 'wav':
        return <IconMusic {...iconProps} className="text-[#FFD74B]" />
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
        return <IconCode {...iconProps} className="text-[#4BFFFF]" />
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
      className={`fixed bottom-4 right-4 z-50 w-[320px] overflow-hidden bg-[#1a1b3b] shadow-xl shadow-black/25 md:w-[420px] ${montserrat_paragraph.variable}`}
    >
      <div className="flex items-center justify-between border-b border-[#2a2c4c] bg-[#12132b] px-5 py-4">
        <div className="flex flex-col gap-1">
          <Text
            size="sm"
            weight={600}
            className={`text-white ${montserrat_heading.variable} font-montserratHeading`}
          >
            {allComplete
              ? `${currentFiles.length} document${currentFiles.length > 1 ? 's' : ''} ready for chat`
              : `Processing ${currentFiles.length} document${currentFiles.length > 1 ? 's' : ''}`}
          </Text>
          <Text
            size="xs"
            className={`text-[#8e8eb2] ${montserrat_paragraph.variable} font-montserratParagraph`}
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
            className="h-8 w-8 rounded-md p-0 hover:bg-[#2a2c4c] hover:text-white"
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
            className="h-8 w-8 rounded-md p-0 hover:bg-[#2a2c4c] hover:text-white"
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
                  <div className="flex h-8 w-8 items-center justify-center">
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
                      className={`truncate font-medium text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
                      title={file.name}
                    >
                      {file.name ? truncateText(file.name, 30) : file.name}
                    </Text>
                    <div className="flex items-center gap-2">
                      <Text
                        size="xs"
                        className={`truncate text-[#8e8eb2] ${montserrat_paragraph.variable} font-montserratParagraph`}
                        title={getStatusMessage(file.status)}
                      >
                        {getStatusMessage(
                          file.status,
                          file.url,
                          file.type,
                          file.isBaseUrl,
                        )}
                      </Text>
                      {file.status === 'error' && file.url && (
                        <Tooltip label="Copy URL" position="right">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => {
                              navigator.clipboard.writeText(file.url || '')
                              showNotification({
                                title: 'URL Copied',
                                message: 'URL has been copied to clipboard',
                                color: 'teal',
                                icon: <IconCheck size={16} />,
                                styles: (theme) => ({
                                  root: {
                                    backgroundColor: '#1a1b3b',
                                    borderColor: theme.colors.teal[6],
                                  },
                                  title: { color: 'white' },
                                  description: { color: 'white' },
                                  closeButton: {
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: theme.colors.teal[7],
                                    },
                                  },
                                }),
                              })
                            }}
                            className="hover:bg-[#2a2c4c] hover:text-white"
                          >
                            <IconCopy size={12} className="text-[#8e8eb2]" />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </div>
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
                        <IconCheck size={18} className="text-[#22C55E]" />
                      </Tooltip>
                    )}
                    {file.status === 'error' && (
                      <Tooltip
                        label="Upload failed"
                        classNames={{
                          tooltip: `${montserrat_paragraph.variable} font-montserratParagraph`,
                        }}
                      >
                        <IconX size={18} className="text-[#FF4B4B]" />
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
