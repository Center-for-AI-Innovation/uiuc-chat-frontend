import Image from 'next/image'
import {
  Text,
  Title,
  Flex,
  createStyles,
  Accordion,
  Card,
  // rem,
  // Group,
  // Card,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // Group,
  // Divider,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

// import Link from 'next/link'
import React from 'react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'
import {
  IconFileText,
  IconFileDescription,
  IconPresentation,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileTypePpt,
  IconFileTypeXls,
  IconVideo,
  IconPhoto,
  IconMusic,
  IconCode,
  IconFileTypeTxt,
  IconUpload,
  IconWorld,
  IconSchool,
  IconBook,
  TablerIconsProps
} from '@tabler/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../Tooltip'
import { motion } from 'framer-motion'

interface FileType {
  icon: (props: TablerIconsProps) => JSX.Element,
  // icon: React.FC<TablerIconsProps>,
  label: string,
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
  const { classes, theme } = useStyles()
  // className={classes.wrapper}
  const fileTypes: FileType[] = [
    { icon: IconFileTypePdf, label: 'PDF', color: 'text-red-500' },
    { icon: IconFileTypeDocx, label: 'Word', color: 'text-blue-500' },
    { icon: IconFileTypePpt, label: 'PPT', color: 'text-orange-500' },
    { icon: IconFileTypeXls, label: 'Excel', color: 'text-green-500' },
    { icon: IconVideo, label: 'Video', color: 'text-purple-500' },
    { icon: IconPhoto, label: 'Image', color: 'text-pink-500' },
    { icon: IconMusic, label: 'Audio', color: 'text-yellow-500' },
    { icon: IconCode, label: 'Code', color: 'text-cyan-500' },
    { icon: IconFileTypeTxt, label: 'Text', color: 'text-white' }
  ]

  return (
    <>
      <TooltipProvider>
        <div className="flex flex-wrap justify-center gap-4 mb-6 mt-8">
          {fileTypes.map((type, index) => {
            if (!type.icon) {
              console.error(`Missing icon for type: ${type.label}`);
              return null; // Skip rendering this item if icon is missing
            }
            const IconComponent = type.icon;

            return (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center"
                  >
                    <IconComponent className={`w-6 h-6 ${type.color}`} size={24} stroke={1.5} />
                    <span className="text-xs text-gray-400 mt-1">{type.label}</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{type.label} files supported</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </>
  )
}

export default SupportedFileUploadTypes