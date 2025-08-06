// UnifiedFilePreview.tsx
import React, { useState, useEffect } from 'react'
import { Modal } from '@mantine/core'
import { montserrat_heading } from 'fonts'
import { fetchPresignedUrl } from '~/utils/apiUtils'

interface UnifiedFilePreviewProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  fileUrl?: string
  fileType?: string
  courseName?: string
  // For direct image URLs (not S3)
  directImageUrl?: string
}

export const UnifiedFilePreview: React.FC<UnifiedFilePreviewProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  courseName,
  directImageUrl,
}) => {
  const [actualFileUrl, setActualFileUrl] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')

  // Determine file type
  const isImage = 
    fileType?.includes('image') ||
    fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
    !!directImageUrl

  const isPdf = 
    fileType?.includes('pdf') || 
    fileName.toLowerCase().endsWith('.pdf')

  const isTextFile = 
    fileType?.includes('text') ||
    fileName.toLowerCase().match(/\.(txt|md|html|xml|csv|py|js|ts|json|srt|vtt)$/i)

  // Handle URL resolution
  useEffect(() => {
    if (isOpen) {
      if (directImageUrl) {
        // Direct image URL (for ImagePreview)
        setActualFileUrl(directImageUrl)
      } else if (fileUrl && courseName) {
        // S3 file URL (for FilePreviewModal)
        fetchPresignedUrl(fileUrl, courseName).then((url) => {
          setActualFileUrl(url || '')
        })
      }
    }
  }, [fileUrl, directImageUrl, courseName, isOpen])

  // Load text content for text files
  useEffect(() => {
    if (isTextFile && actualFileUrl && isOpen) {
      fetch(actualFileUrl)
        .then(response => response.text())
        .then(text => setTextContent(text))
        .catch(error => {
          console.error('Failed to load text content:', error)
          setTextContent('Failed to load file content')
        })
    }
  }, [isTextFile, actualFileUrl, isOpen])

  // Auto-download non-previewable files
  useEffect(() => {
    if (actualFileUrl && isOpen && !isImage && !isPdf && !isTextFile) {
      const link = document.createElement('a')
      link.href = actualFileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onClose()
    }
  }, [actualFileUrl, isOpen, isImage, isPdf, isTextFile, fileName, onClose])

  // Don't render modal for non-previewable files
  if (isOpen && !isImage && !isPdf && !isTextFile) {
    return null
  }

  return (
    <Modal.Root opened={isOpen} onClose={onClose} centered size="xl">
      <Modal.Overlay className="modal-overlay-common" />
      <Modal.Content className="modal-common">
        <Modal.Header className="modal-header-common">
          <Modal.Title className={`modal-title-common ${montserrat_heading.variable} font-montserratHeading`}>
            {fileName}
          </Modal.Title>
          <Modal.CloseButton
            onClick={onClose}
            aria-label="Close file preview"
            className="modal-close-button-common"
          />
        </Modal.Header>
        <Modal.Body className="modal-body-common">
          <div className="file-preview-container">
            {isImage && actualFileUrl ? (
              <img
                src={actualFileUrl}
                alt={fileName}
                className="file-preview-image"
              />
            ) : isPdf && actualFileUrl ? (
              <iframe
                src={actualFileUrl}
                className="file-preview-iframe"
                title={fileName}
              />
            ) : isTextFile && actualFileUrl ? (
              <div className="file-preview-text">
                <pre>{textContent}</pre>
              </div>
            ) : null}
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
} 