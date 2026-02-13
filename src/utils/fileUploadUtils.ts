import { type ContextWithMetadata } from '~/types/chat'

// --- Types ---

export type FileUploadStatus = {
  file: File
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'
  url?: string
  contexts?: ContextWithMetadata[]
}

// --- Constants ---

export const MAX_FILE_COUNT = 5
export const MAX_TOTAL_SIZE_BYTES = 15 * 1024 * 1024

export const ALLOWED_FILE_EXTENSIONS = [
  'html',
  'py',
  'pdf',
  'txt',
  'md',
  'srt',
  'vtt',
  'docx',
  'ppt',
  'pptx',
  'xlsx',
  'xls',
  'xlsm',
  'xlsb',
  'xltx',
  'xltm',
  'xlt',
  'xml',
  'xlam',
  'xla',
  'xlw',
  'xlr',
  'csv',
  'png',
  'jpg',
  'jpeg',
]

// --- Helpers ---

export const createFileKey = (file: File): string => {
  return `${file.name}-${file.type}`
}

export const removeDuplicateFiles = (files: File[]): File[] => {
  const fileKeys = new Set<string>()
  return files.filter((file) => {
    const fileKey = createFileKey(file)
    if (fileKeys.has(fileKey)) {
      return false
    }
    fileKeys.add(fileKey)
    return true
  })
}

export const isImageFile = (file: File): boolean => {
  return (
    file.type.startsWith('image/') ||
    ['png', 'jpg', 'jpeg'].includes(
      file.name.split('.').pop()?.toLowerCase() || '',
    )
  )
}

export const truncateFileName = (name: string, maxLength = 25): string => {
  if (name.length <= maxLength) return name
  const extension = name.split('.').pop()
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
  return `${nameWithoutExt.substring(0, maxLength - 3)}...${extension ? `.${extension}` : ''}`
}
