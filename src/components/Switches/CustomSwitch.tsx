import React, { useState } from 'react'
import { Switch, Tooltip, Text } from '@mantine/core'
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'

interface CustomSwitchProps {
  label: string
  tooltip: string
  checked: boolean
  onChange: (value: boolean) => void
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  label,
  tooltip,
  checked,
  onChange,
}) => {
  const [isContainerHovered, setIsContainerHovered] = useState(false)

  const handleToggle = (event: React.MouseEvent) => {
    // Prevent the event from bubbling up to avoid double triggers
    event.preventDefault()
    onChange(!checked)
  }

  return (
    <div
      className="flex cursor-pointer items-center rounded-lg p-2 transition-all duration-200 ease-in-out"
      style={{
        backgroundColor: isContainerHovered
          ? 'rgba(255, 255, 255, 0.1)'
          : 'transparent',
        transform: isContainerHovered ? 'translateY(-1px)' : 'none',
        boxShadow: isContainerHovered
          ? '0 4px 6px rgba(255, 255, 255, 0.1)'
          : 'none',
      }}
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => setIsContainerHovered(false)}
      onClick={handleToggle}
    >
      <Switch
        checked={checked}
        onClick={handleToggle}
        size="lg"
        onLabel="ON"
        offLabel="OFF"
        classNames={{
          root: 'flex items-center cursor-pointer',
          track: `bg-gray-700 hover:bg-gray-600 cursor-pointer`, // Added 'cursor-pointer' here
          thumb: 'bg-white cursor-pointer', // Ensure thumb also has 'cursor-pointer'
          label: `ml-2 ${montserrat_paragraph.variable} font-montserratParagraph text-md text-white cursor-pointer`,
        }}
        thumbIcon={
          checked ? (
            <IconCheck size="0.8rem" color="purple" stroke={3} />
          ) : (
            <IconX size="0.8rem" color="grey" stroke={3} />
          )
        }
        styles={{
          root: {
            cursor: 'pointer',
          },
          input: {
            cursor: 'pointer',
            '&:focus': {
              outline: 'none',
            },
            '&:focus + *': {
              boxShadow: 'none',
            },
          },
          track: {
            backgroundColor: checked ? '#6a29a4 !important' : '#25262b',
            borderColor: checked ? '#6a29a4 !important' : '#25262b',
            cursor: 'pointer', // Reinforced cursor here
          },
          thumb: {
            width: 22,
            height: 22,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow:
                '0 0 0 3px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      />
      <span
        className={`${montserrat_paragraph.variable} text-md ml-3 flex items-center font-montserratParagraph transition-colors duration-200 ease-in-out ${
          isContainerHovered ? 'text-white' : 'text-gray-200'
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
              transform: isContainerHovered ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconInfoCircle
              size={16}
              className={isContainerHovered ? 'text-white' : 'text-gray-400'}
              style={{ transition: 'all 0.2s ease-in-out' }}
            />
          </span>
        </Tooltip>
      </span>
    </div>
  )
}

export default CustomSwitch
