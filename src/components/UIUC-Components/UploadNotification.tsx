'use client'

import React, { useState, useEffect } from 'react'
import { Card, Text, Button } from '@mantine/core'
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconLoader2,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FileUpload {
  name: string
  status: 'uploading' | 'ingesting' | 'complete' | 'error'
  type: 'document' | 'webscrape' | 'canvas' | 'github' | 'mit'
  url?: string
  error?: string
}

interface UploadNotificationProps {
  files: FileUpload[]
  onClose: () => void
  // onCancel: () => void
}

function UploadNotificationContent({
  files,
  onClose,
}: UploadNotificationProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentFiles, setCurrentFiles] = useState<FileUpload[]>([])

  useEffect(() => {
    if (files && Array.isArray(files)) {
      setCurrentFiles(files)
    }
  }, [files])
  // useEffect(() => {
  //   if (files && Array.isArray(files)) {
  //     // Merge new files with existing ones, preventing duplicates and updating status
  //     setCurrentFiles(prevFiles => {
  //       const mergedFiles = [...prevFiles]

  //       files.forEach(newFile => {
  //         const existingFileIndex = mergedFiles.findIndex(f => f.name === newFile.name)

  //         if (existingFileIndex === -1) {
  //           // Add new file if it doesn't exist
  //           mergedFiles.push(newFile)
  //         } else {
  //           // Update existing file's status
  //           mergedFiles[existingFileIndex] = {
  //             ...mergedFiles[existingFileIndex],
  //             ...newFile
  //           }
  //         }
  //       })

  //       return mergedFiles
  //     })
  //   }
  // }, [files])

  const allComplete =
    currentFiles.length > 0 &&
    currentFiles.every((file) => file.status === 'complete')
  const anyUploading = currentFiles.some(
    (file) => file.status === 'uploading' || file.status === 'ingesting',
  )

  const toggleMinimize = () => setIsMinimized(!isMinimized)

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <div className="rounded bg-red-500 p-1 text-xs text-white">PDF</div>
        )
      case 'tsx':
        return (
          <div className="rounded bg-blue-500 p-1 text-xs text-white">TSX</div>
        )
      default:
        return (
          <div className="rounded bg-gray-500 p-1 text-xs text-white">FILE</div>
        )
    }
  }

  const truncateText = (text: string, maxLength = 20) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  if (currentFiles.length === 0) {
    return null
  }

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      className="fixed bottom-4 right-4 z-50 w-96 bg-[#292c5b] shadow-xl shadow-black/25"
    >
      <div className="-mx-4 -mt-3 flex items-center justify-between bg-[#12132b] p-4">
        <Text size="md" weight={500} c="white">
          {allComplete
            ? `${currentFiles.length} ingestion${currentFiles.length > 1 ? 's' : ''} complete`
            : `Indexing ${currentFiles.length} item${currentFiles.length > 1 ? 's' : ''}`}
          {currentFiles.some((file) => file.status === 'uploading') ? (
            <>
              <br />
              Remain on this page until upload is complete or ingest will fail.
            </>
          ) : (
            <>
              <br />
              You may leave the page now.
            </>
          )}
        </Text>
        <div className="flex items-center">
          <Button
            variant="subtle"
            color="gray"
            compact
            onClick={toggleMinimize}
            className="p-0 hover:bg-[#3b3d6b]"
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
            className="ml-2 p-0 hover:bg-[#3b3d6b]"
          >
            <IconX size={18} />
          </Button>
        </div>
      </div>
      {!isMinimized && (
        <div className="mt-2 space-y-2">
          <AnimatePresence>
            {currentFiles.map((file, index) => {
              return (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  {getFileIcon(file.name.split('.').pop() || '')}
                  <div className="ml-2 flex-grow">
                    <Text
                      size="sm"
                      className="truncate"
                      c="white"
                      title={file.name}
                    >
                      {truncateText(file.name)}
                    </Text>
                    <Text size="xs" c="dimmed" title={file.url}>
                      {file.url
                        ? truncateText(file.url)
                        : file.status === 'uploading'
                          ? 'Uploading...'
                          : file.status === 'ingesting'
                            ? 'Ingesting...'
                            : file.status === 'complete'
                              ? 'Complete'
                              : 'Error'}
                    </Text>
                  </div>
                  {(file.status === 'uploading' ||
                    file.status === 'ingesting') && (
                    <IconLoader2
                      size={18}
                      className="ml-2 animate-spin text-blue-500"
                    />
                  )}
                  {file.status === 'complete' && (
                    <IconCheck size={18} className="ml-2 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <IconX size={18} className="ml-2 text-red-500" />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {/* {anyUploading && (
          <Button
            variant="light"
            color="red"
            size="xs"
            fullWidth
          // onClick={onCancel}
          >
            Cancel
          </Button>
        )} */}
        </div>
      )}
    </Card>
  )
}

export default function UploadNotification(props: UploadNotificationProps) {
  return <UploadNotificationContent {...props} />
}
