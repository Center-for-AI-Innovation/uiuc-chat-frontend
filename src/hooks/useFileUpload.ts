import { useUploadToS3 } from '~/hooks/queries/useUploadToS3'
import { useDownloadPresignedUrl } from '~/hooks/queries/useDownloadPresignedUrl'
import { useFetchContexts } from '@/hooks/queries/useFetchContexts'
import { useChatFileUpload } from '@/hooks/queries/useChatFileUpload'

import { type Dispatch, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { type ActionType } from '@/hooks/useCreateReducer'
import { type Conversation, type ContextWithMetadata } from '~/types/chat'
import { type HomeInitialState } from '~/pages/api/home/home.state'
import {
  showToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '~/utils/toastUtils'
import {
  type FileUploadStatus,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_COUNT,
  MAX_TOTAL_SIZE_BYTES,
  createFileKey,
  removeDuplicateFiles,
  isImageFile,
} from '~/utils/fileUploadUtils'

async function createNewConversation(
  courseName: string,
  homeDispatch: Dispatch<ActionType<HomeInitialState>>,
): Promise<Conversation> {
  const conversationId = uuidv4()
  const newConversation: Conversation = {
    id: conversationId,
    name: `File Upload - ${new Date().toLocaleString()}`,
    messages: [],
    model: {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      tokenLimit: 128000,
      enabled: true,
    },
    prompt:
      'You are a helpful assistant. You can analyze uploaded files and answer questions.',
    temperature: 0.5,
    folderId: null,
    createdAt: new Date().toISOString(),
  }

  homeDispatch({ field: 'selectedConversation', value: newConversation })
  homeDispatch({
    field: 'conversations',
    value: (prev: Conversation[]) => [newConversation, ...prev],
  })

  return newConversation
}

interface UseFileUploadParams {
  courseName: string
  user_id: string
  selectedConversation: Conversation | undefined
  homeDispatch: Dispatch<ActionType<HomeInitialState>>
}

export function useFileUpload({
  courseName,
  user_id,
  selectedConversation,
  homeDispatch,
}: UseFileUploadParams) {
  // React Query hooks
  const uploadToS3Mutation = useUploadToS3()
  const { mutateAsync: getPresignedUrl } = useDownloadPresignedUrl()
  const { mutateAsync: fetchContextsAsync } = useFetchContexts()
  const { mutateAsync: chatFileUploadAsync } = useChatFileUpload()

  const [fileUploads, setFileUploads] = useState<FileUploadStatus[]>([])
  const fileUploadRef = useRef<HTMLInputElement | null>(null)

  const hasProcessingFiles = useMemo(
    () =>
      fileUploads.some(
        (fu) =>
          fu.status === 'processing' ||
          fu.status === 'uploading' ||
          fu.status === 'uploaded',
      ),
    [fileUploads],
  )

  const removeFileUpload = (index: number) => {
    setFileUploads((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFileUploads = () => {
    setFileUploads([])
    if (fileUploadRef.current) {
      fileUploadRef.current.value = ''
    }
  }

  async function handleFileSelection(newFiles: File[]) {
    const allFiles = [...fileUploads.map((f) => f.file), ...newFiles]

    // 1. Validation: number of files
    if (allFiles.length > MAX_FILE_COUNT) {
      showToast({
        title: 'Too Many Files',
        message: `You can upload a maximum of ${MAX_FILE_COUNT} files at once. Please remove some files before adding new ones.`,
        type: 'error',
        autoClose: 6000,
      })
      return
    }

    // 2. Validation: total size
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      showToast({
        title: 'Files Too Large',
        message: `The total size of all files cannot exceed ${MAX_TOTAL_SIZE_BYTES / 1024 / 1024}MB. Please remove large files or upload smaller ones.`,
        type: 'error',
        autoClose: 6000,
      })
      return
    }

    // 3. Validation: file types
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        showToast({
          title: 'Unsupported File Type',
          message: `The file "${file.name}" is not supported. Please upload files of the following types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}.`,
          type: 'error',
          autoClose: 6000,
        })
        return
      }
    }

    // Prevent duplicates by name and type
    const existingFiles = new Set(
      fileUploads.map((fu) => createFileKey(fu.file)),
    )
    const uniqueNewFiles = newFiles.filter(
      (file) => !existingFiles.has(createFileKey(file)),
    )

    if (uniqueNewFiles.length === 0) {
      showWarningToast(
        'All selected files are already uploaded or in progress.',
        'Duplicate Files',
      )
      return
    }

    // Check for duplicates within the new files themselves
    const finalUniqueFiles = removeDuplicateFiles(uniqueNewFiles)

    if (finalUniqueFiles.length === 0) {
      showWarningToast('All selected files are duplicates.', 'Duplicate Files')
      return
    }

    if (finalUniqueFiles.length < uniqueNewFiles.length) {
      const duplicateCount = uniqueNewFiles.length - finalUniqueFiles.length
      showInfoToast(
        `${duplicateCount} duplicate file(s) were removed from the selection.`,
        'Duplicate Files Removed',
      )
    }

    for (const file of finalUniqueFiles) {
      const isImage = isImageFile(file)

      // Add to fileUploads
      setFileUploads((prev) => [
        ...prev,
        {
          file,
          status: 'uploading' as const,
        },
      ])

      // Upload all files to S3 and update status
      try {
        const s3Key = await uploadToS3Mutation.mutateAsync({
          file,
          uniqueFileName: `${crypto.randomUUID()}.${file.name.split('.').pop()}`,
          courseName,
          user_id,
          uploadType: 'chat',
        })

        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name
              ? { ...f, status: 'uploaded', url: s3Key }
              : f,
          ),
        )

        // Immediately process the file after S3 upload
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name ? { ...f, status: 'processing' } : f,
          ),
        )

        // Create conversation if needed
        let conversation = selectedConversation
        if (!conversation?.id) {
          conversation = await createNewConversation(courseName, homeDispatch)
        }

        // image file returns a presigned URL for display
        // non-image file returns a context from context search service
        if (isImage) {
          console.log('=== FILE UPLOAD STEP 4A: Processing image file ===')
          // For image files, generate a presigned URL for display
          if (s3Key) {
            const presignedUrl = await getPresignedUrl({
              filePath: s3Key,
              courseName,
            })
            console.log('Generated presigned URL for image:', presignedUrl)
            if (presignedUrl) {
              setFileUploads((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, status: 'completed', url: presignedUrl }
                    : f,
                ),
              )
              console.log('Image file processing completed')
            } else {
              // Fallback to S3 key if presigned URL generation fails
              setFileUploads((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, status: 'completed', url: s3Key }
                    : f,
                ),
              )
              console.log(
                'Image file processing completed (fallback to S3 key)',
              )
            }
          } else {
            // Handle case where s3Key is undefined
            setFileUploads((prev) =>
              prev.map((f) =>
                f.file.name === file.name ? { ...f, status: 'error' } : f,
              ),
            )
            console.log('Image file processing failed: no S3 key')
          }
        } else {
          // For non-image files, use the regular file processing
          await chatFileUploadAsync({
            conversationId: conversation.id,
            courseName: courseName,
            user_id: user_id,
            s3Key: s3Key || '',
            fileName: file.name,
            fileType: file.type,
            model: conversation.model?.id,
          })

          // Add a small delay to allow backend processing to complete
          await new Promise((resolve) => setTimeout(resolve, 2000))

          const allContexts = await fetchContextsAsync({
            course_name: courseName,
            user_id,
            search_query: file.name, // Use filename as search query
            token_limit: 4000,
            doc_groups: ['All Documents'],
            conversation_id: conversation.id,
          })

          // Filter by filename to ensure we get contexts for this specific file
          const contexts = allContexts.filter(
            (context: ContextWithMetadata) =>
              context.readable_filename === file.name,
          )

          setFileUploads((prev) =>
            prev.map((f) =>
              f.file.name === file.name
                ? { ...f, status: 'completed', contexts }
                : f,
            ),
          )
        }
      } catch (error) {
        setFileUploads((prev) =>
          prev.map((f) =>
            f.file.name === file.name ? { ...f, status: 'error' } : f,
          ),
        )
        showErrorToast(
          `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }
  }

  return {
    fileUploads,
    fileUploadRef,
    handleFileSelection,
    removeFileUpload,
    clearFileUploads,
    hasProcessingFiles,
  }
}
