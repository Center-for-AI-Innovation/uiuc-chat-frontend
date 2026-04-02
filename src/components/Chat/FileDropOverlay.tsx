import { rem } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconCloudUpload } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { showToast } from '~/utils/toastUtils'

const MAX_FILE_SIZE = 15 * 1024 * 1024

interface FileDropOverlayProps {
  onFilesDropped: (files: File[]) => void
}

export const FileDropOverlay = ({ onFilesDropped }: FileDropOverlayProps) => {
  return (
    <Dropzone.FullScreen
      multiple
      activateOnClick={false}
      activateOnKeyboard={false}
      maxSize={MAX_FILE_SIZE}
      onDrop={(files) => onFilesDropped(files)}
      onReject={(rejections) => {
        const tooLarge = rejections.some((r) =>
          r.errors.some((e) => e.code === 'file-too-large'),
        )
        if (tooLarge) {
          showToast({
            title: 'File Too Large',
            message: 'One or more files exceed the 15MB size limit.',
            type: 'error',
            autoClose: 6000,
          })
        }
      }}
      className={`cursor-default overflow-hidden border-none bg-transparent p-0 hover:bg-transparent [&>.mantine-Dropzone-root[data-accept]]:border-[3px] [&>.mantine-Dropzone-root[data-accept]]:border-dashed [&>.mantine-Dropzone-root[data-accept]]:border-[--illinois-orange] [&>.mantine-Dropzone-root[data-accept]]:bg-black/5 [&>.mantine-Dropzone-root[data-accept]]:backdrop-blur-sm dark:[&>.mantine-Dropzone-root[data-accept]]:bg-white/5 [&>.mantine-Dropzone-root]:flex [&>.mantine-Dropzone-root]:items-center [&>.mantine-Dropzone-root]:justify-center [&>.mantine-Dropzone-root]:rounded-none [&>.mantine-Dropzone-root]:border-none [&>.mantine-Dropzone-root]:bg-transparent`}
    >
      <Dropzone.Accept>
        <div className="flex flex-col items-center justify-center gap-4">
          <IconCloudUpload
            size={rem(52)}
            stroke={1.5}
            className="text-[--illinois-blue] dark:text-neutral-100"
          />
          <p
            className={`${montserrat_heading.variable} font-montserratHeading text-2xl tracking-tight text-[--illinois-blue] dark:text-neutral-100`}
          >
            Drop files here
          </p>
          <p
            className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm text-[--illinois-blue] dark:text-neutral-400`}
          >
            PDF, DOCX, TXT, images, and more
          </p>
        </div>
      </Dropzone.Accept>
      <Dropzone.Idle>{null}</Dropzone.Idle>
    </Dropzone.FullScreen>
  )
}
