'use client'

import React, { useState, useEffect } from 'react'
import { Card, Text, Button, Progress, MantineProvider } from '@mantine/core'
import { IconCheck, IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-react'

export interface FileUpload {
  name: string
  progress: number
  status: 'uploading' | 'complete' | 'error'
}

interface UploadNotificationProps {
  files: FileUpload[]
  onClose: () => void
  onCancel: () => void
}

function UploadNotificationContent({ files, onClose, onCancel }: UploadNotificationProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentFiles, setCurrentFiles] = useState<FileUpload[]>([])

  useEffect(() => {
    if (files && Array.isArray(files)) {
      setCurrentFiles(files)
    }
  }, [files])

  const allComplete = currentFiles.length > 0 && currentFiles.every(file => file.status === 'complete')
  const anyUploading = currentFiles.some(file => file.status === 'uploading')

  const toggleMinimize = () => setIsMinimized(!isMinimized)

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <div className="bg-red-500 text-white p-1 rounded text-xs">PDF</div>
      case 'tsx':
        return <div className="bg-blue-500 text-white p-1 rounded text-xs">TSX</div>
      default:
        return <div className="bg-gray-500 text-white p-1 rounded text-xs">FILE</div>
    }
  }

  if (currentFiles.length === 0) {
    return null
  }

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      // withBorder
      className="fixed bottom-4 right-4 w-96 bg-[#292c5b] z-50"
    >
      <div className="flex items-center justify-between">
        <Text size="md" weight={500} c='white'>
          {allComplete
            ? `${currentFiles.length} upload${currentFiles.length > 1 ? 's' : ''} complete`
            : `Uploading ${currentFiles.length} item${currentFiles.length > 1 ? 's' : ''}`
          }
        </Text>
        <div className="flex items-center">
          <Button
            variant="subtle"
            color="gray"
            compact
            onClick={toggleMinimize}
            className="p-0 hover:bg-[#3b3d6b]"
          >
            {isMinimized ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </Button>
          <Button
            variant="subtle"
            color="gray"
            compact
            onClick={onClose}
            className="p-0 ml-2 hover:bg-[#3b3d6b]"
          >
            <IconX size={18} />
          </Button>
        </div>
      </div>
      {!isMinimized && (
        <div className="mt-2 space-y-2">
          {currentFiles.map((file, index) => (
            <div key={index} className="flex items-center">
              {getFileIcon(file.name.split('.').pop() || '')}
              <div className="ml-2 flex-grow">
                <Text size="sm" className="truncate" c='white'>{file.name}</Text>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} size="xs" className="mt-1" />
                )}
              </div>
              {file.status === 'complete' && <IconCheck size={18} className="text-green-500 ml-2" />}
            </div>
          ))}
          {anyUploading && (
            <Button
              variant="light"
              color="red"
              size="xs"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function UploadNotification(props: UploadNotificationProps) {
  return (
    <MantineProvider>
      <UploadNotificationContent {...props} />
    </MantineProvider>
  )
}