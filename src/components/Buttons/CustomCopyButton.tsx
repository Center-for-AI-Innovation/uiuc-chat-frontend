import React, { useState } from 'react'
import { Button, Tooltip, Text } from '@mantine/core'
import { IconCopy, IconInfoCircle } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'

interface CustomCopyButtonProps {
  label: string
  tooltip: string
  onClick: () => void
}

const CustomCopyButton: React.FC<CustomCopyButtonProps> = ({
  label,
  tooltip,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="flex cursor-pointer items-center rounded-lg p-2 transition-all duration-200 ease-in-out"
      style={{
        backgroundColor: isHovered
          ? 'rgba(255, 255, 255, 0.1)'
          : 'transparent',
        transform: isHovered ? 'translateY(-1px)' : 'none',
        boxShadow: isHovered ? '0 4px 6px rgba(255, 255, 255, 0.1)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Button
        className={`
          relative flex items-center 
          justify-center bg-purple-800 
          px-3 py-2
          text-center text-white transition-colors
          duration-200
          hover:bg-purple-700 active:bg-purple-900 
          ${montserrat_paragraph.variable} font-montserratParagraph
        `}
        styles={{
          root: {
            height: 'auto',
            minHeight: 36,
            cursor: 'pointer',
          },
          inner: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            gap: '4px',
          },
          label: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '@media (max-width: 480px)': {
              whiteSpace: 'normal',
            },
          },
        }}
      >
        <IconCopy size={18} />
      </Button>
      <span
        className={`${montserrat_paragraph.variable} text-md ml-3 flex items-center font-montserratParagraph transition-colors duration-200 ease-in-out ${
          isHovered ? 'text-white' : 'text-gray-200'
        }`}
      >
        {label}
        <Tooltip
          label={
            <Text size="sm" color="gray.1">
              {tooltip}
            </Text>
          }
          position="bottom"
          withArrow
          multiline
          width={220}
          withinPortal
          styles={(theme) => ({
            tooltip: {
              backgroundColor: theme.colors.dark[7],
              color: theme.colors.gray[2],
              borderRadius: theme.radius.md,
              fontSize: theme.fontSizes.sm,
              padding: '8px 12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            arrow: {
              backgroundColor: theme.colors.dark[7],
            },
          })}
        >
          <span
            className="ml-2 cursor-pointer transition-transform duration-200 ease-in-out"
            style={{
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconInfoCircle
              size={16}
              className={isHovered ? 'text-white' : 'text-gray-400'}
              style={{ transition: 'all 0.2s ease-in-out' }}
            />
          </span>
        </Tooltip>
      </span>
    </div>
  )
}

export default CustomCopyButton