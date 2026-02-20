import {
  IconFileTypeTxt,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFile,
  IconX,
} from '@tabler/icons-react'
import {
  type FileUploadStatus,
  truncateFileName,
} from '~/utils/fileUploadUtils'

interface FileUploadPreviewProps {
  fileUploads: FileUploadStatus[]
  onRemove: (index: number) => void
}

const iconProps = { size: 20 }
const iconStyle = { color: 'var(--illinois-orange)' }

function getFileIcon(name: string, type?: string) {
  const extension = name.split('.').pop()?.toLowerCase()

  if (type?.includes('pdf') || extension === 'pdf') {
    return <IconFileTypePdf {...iconProps} style={iconStyle} />
  }
  if (type?.includes('doc') || extension === 'docx' || extension === 'doc') {
    return <IconFileTypeDocx {...iconProps} style={iconStyle} />
  }
  if (type?.includes('text') || extension === 'txt') {
    return <IconFileTypeTxt {...iconProps} style={iconStyle} />
  }
  return <IconFile {...iconProps} style={iconStyle} />
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'uploading':
    case 'processing':
      return (
        <div
          style={{
            height: '16px',
            width: '16px',
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            border: '2px solid var(--primary)',
            borderTopColor: 'transparent',
          }}
        />
      )
    case 'completed':
      return (
        <div
          style={{
            display: 'flex',
            height: '16px',
            width: '16px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'var(--illinois-prairie)',
          }}
        >
          <svg
            style={{
              height: '10px',
              width: '10px',
              color: 'white',
            }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )
    case 'error':
      return (
        <div
          style={{
            display: 'flex',
            height: '16px',
            width: '16px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'var(--destructive)',
          }}
        >
          <svg
            style={{
              height: '10px',
              width: '10px',
              color: 'white',
            }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )
    default:
      return null
  }
}

export const FileUploadPreview = ({
  fileUploads,
  onRemove,
}: FileUploadPreviewProps) => {
  return (
    <div
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {fileUploads.map((fu, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background-faded)',
            padding: '8px 12px',
            transition: 'all 0.2s ease',
          }}
        >
          {getFileIcon(fu.file.name, fu.file.type)}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--foreground)',
              }}
            >
              {truncateFileName(fu.file.name)}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--foreground-faded)',
              }}
            >
              {fu.status === 'uploading' && 'Uploading...'}
              {fu.status === 'processing' && 'Processing...'}
              {fu.status === 'completed' && 'Ready for chat'}
              {fu.status === 'error' && 'Upload failed'}
            </span>
          </div>
          {getStatusIcon(fu.status)}
          <button
            onClick={() => onRemove(index)}
            title="Remove file"
            aria-label="Remove file"
            style={{
              marginLeft: '8px',
              color: 'var(--foreground-faded)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)'
              e.currentTarget.style.backgroundColor = 'var(--background-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--foreground-faded)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <IconX size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
