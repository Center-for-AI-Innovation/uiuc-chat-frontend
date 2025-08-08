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
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={'xxl'}
        closeOnEscape={true}
        transitionProps={{ transition: 'fade', duration: 200 }}
        centered
        radius={'lg'}
        overlayProps={{ blur: 3, opacity: 0.55 }}
        styles={{
          header: {
            backgroundColor: 'var(--modal-border)',
          },
          body: {
            backgroundColor: 'var(--modal-border)',
          },
          title: {
            color: 'white',
            fontFamily: montserrat_heading.variable,
            fontWeight: 'bold',
          },
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <img src={src} alt={alt} />
        </div>
      </Modal>
    </>
  )
}
