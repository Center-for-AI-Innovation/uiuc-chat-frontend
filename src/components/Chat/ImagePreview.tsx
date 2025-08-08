// ImagePreview.tsx
import { useState } from 'react'
import { Modal, createStyles } from '@mantine/core'
import { montserrat_heading } from 'fonts'

const useStyles = createStyles((theme) => ({
  imageLoading: {
    background:
      'linear-gradient(90deg, #f0f0f0 0px, rgba(229,229,229,0.8) 40px, #f0f0f0 80px)',
    backgroundSize: '600px',
    animation: '$loading 1.2s infinite',
  },
  '@keyframes loading': {
    '0%': {
      backgroundPosition: '-600px 0',
    },
    '100%': {
      backgroundPosition: '600px 0',
    },
  },
}))

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  className,
}) => {
  const { classes, theme } = useStyles()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setIsModalOpen(true)}
        style={{ cursor: 'pointer' }}
        onLoad={() => setIsImageLoaded(true)}
        className={
          isImageLoaded ? className : `${className} ${classes.imageLoading}`
        }
      />
      <Modal.Root
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        centered
      >
        <Modal.Overlay className="modal-overlay-common" />
        <Modal.Content className="modal-common">
          <Modal.Header className="modal-header-common">
            <Modal.Title className={`modal-title-common ${montserrat_heading.variable} font-montserratHeading`}>
              {alt || 'Image Preview'}
            </Modal.Title>
            <Modal.CloseButton
              onClick={() => setIsModalOpen(false)}
              aria-label="Close image preview"
              className="modal-close-button-common"
            />
          </Modal.Header>
          <Modal.Body className="modal-body-common">
            <div className="file-preview-container">
              <img 
                src={src} 
                alt={alt} 
                className="file-preview-image"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              />
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  )
}
