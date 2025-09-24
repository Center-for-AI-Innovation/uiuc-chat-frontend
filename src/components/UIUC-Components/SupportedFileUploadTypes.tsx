import { createStyles } from '@mantine/core'

import React from 'react'
import {
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypePpt,
  IconFileTypeXls,
  IconVideo,
  IconPhoto,
  IconMusic,
  IconCode,
  IconFileTypeTxt,
  type TablerIconsProps,
} from '@tabler/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../Tooltip'
import { motion } from 'framer-motion'
import { useTranslation } from 'next-i18next';

interface FileType {
  icon: (props: TablerIconsProps) => JSX.Element
  // icon: React.FC<TablerIconsProps>,
  label: string
  color: string
}
const useStyles = createStyles((theme) => ({
  // For Logos
  logos: {
    // width: '30%',
    aspectRatio: '3/2',
    objectFit: 'contain',
    width: '80px',
  },

  smallLogos: {
    // width: '30%',
    aspectRatio: '1/1',
    objectFit: 'contain',
    width: '45px',
  },

  codeStyledText: {
    backgroundColor: '#020307',
    borderRadius: '5px',
    padding: '1px 5px',
    fontFamily: 'monospace',
    alignItems: 'center',
    justifyItems: 'center',
  },

  // For Accordion
  root: {
    borderRadius: theme.radius.lg,
    paddingLeft: 25,
    width: '400px',
    // outline: 'none',
    paddingTop: 20,
    paddingBottom: 20,

    '&[data-active]': {
      paddingTop: 20,
    },
  },
  control: {
    borderRadius: theme.radius.lg,
    // outline: '0.5px solid ',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)', // 20% white on hover
    },
  },
  content: {
    borderRadius: theme.radius.lg,
  },
  panel: {
    borderRadius: theme.radius.lg,
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.lg,
    position: 'relative',
    // zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: '#15162b',
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.xl,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(180deg)',
    },
  },
}))

const SupportedFileUploadTypes = () => {
  const { t } = useTranslation('common')
  const { classes, theme } = useStyles()
  const { t } = useTranslation('common')
  const fileTypes: FileType[] = [
    { icon: IconFileTypePdf, label: t('file_types.pdf') as unknown as string, color: 'text-red-500' },
    { icon: IconFileTypeDocx, label: t('file_types.word') as unknown as string, color: 'text-blue-500' },
    { icon: IconFileTypePpt, label: t('file_types.ppt') as unknown as string, color: 'text-orange-500' },
    { icon: IconFileTypeXls, label: t('file_types.excel') as unknown as string, color: 'text-green-500' },
    { icon: IconVideo, label: t('file_types.video') as unknown as string, color: 'text-purple-500' },
    { icon: IconPhoto, label: t('file_types.image') as unknown as string, color: 'text-pink-500' },
    { icon: IconMusic, label: t('file_types.audio') as unknown as string, color: 'text-yellow-500' },
    { icon: IconCode, label: t('file_types.code') as unknown as string, color: 'text-cyan-500' },
    { icon: IconFileTypeTxt, label: t('file_types.text') as unknown as string, color: 'text-white' },
  ]

  return (
    <>
      <TooltipProvider>
        <div className="mb-6 mt-8 flex flex-wrap justify-center gap-4">
          {fileTypes.map((type, index) => {
            if (!type.icon) {
              console.error(`Missing icon for type: ${type.label}`)
              return null // Skip rendering this item if icon is missing
            }
            const IconComponent = type.icon

            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <IconComponent
                      className={`h-6 w-6 ${type.color}`}
                      size={24}
                      stroke={1.5}
                    />
                    <span className="mt-1 text-xs text-gray-400">
                      {type.label}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('file_types.files_supported', { type: type.label })}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </>
  )
}

export default SupportedFileUploadTypes
