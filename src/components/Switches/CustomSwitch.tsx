import React, { useState } from 'react'
import { Switch, Tooltip, Text } from '@mantine/core'
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'

interface CustomSwitchProps {
  label: string
  tooltip: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  label,
  tooltip,
  checked,
  onChange,
  disabled = false,
}) => {
  const [isContainerHovered, setIsContainerHovered] = useState(false)

  const handleToggle = (event: React.MouseEvent) => {
    if (disabled) return;
    // Prevent the event from bubbling up to avoid double triggers
    event.preventDefault()
    onChange(!checked)
  }

  return (
    <div
      className={`flex items-center rounded-lg p-2 transition-all duration-200 ease-in-out ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
      style={{
        backgroundColor: !disabled && isContainerHovered
          ? 'rgba(255, 255, 255, 0.1)'
          : 'transparent',
        transform: !disabled && isContainerHovered ? 'translateY(-1px)' : 'none',
        boxShadow: !disabled && isContainerHovered
          ? '0 4px 6px rgba(255, 255, 255, 0.1)'
          : 'none',
      }}
      onMouseEnter={() => !disabled && setIsContainerHovered(true)}
      onMouseLeave={() => !disabled && setIsContainerHovered(false)}
      onClick={handleToggle}
    >
      <Switch
        checked={checked}
        onClick={handleToggle}
        size="lg"
        onLabel="ON"
        offLabel="OFF"
        disabled={disabled}
        classNames={{
          root: `flex items-center ${disabled ? '' : 'cursor-pointer'}`,
          track: `bg-gray-700 ${disabled ? '' : 'hover:bg-gray-600 cursor-pointer'}`,
          thumb: `bg-white ${disabled ? '' : 'cursor-pointer'}`,
          label: `ml-2 ${montserrat_paragraph.variable} font-montserratParagraph text-md text-white ${disabled ? '' : 'cursor-pointer'}`,
        }}
        thumbIcon={
          checked ? (
            <IconCheck size="0.8rem" color={disabled ? "gray" : "purple"} stroke={3} />
          ) : (
            <IconX size="0.8rem" color="grey" stroke={3} />
          )
        }
        styles={{
          root: {
            cursor: disabled ? 'not-allowed' : 'pointer',
          },
          input: {
            cursor: disabled ? 'not-allowed' : 'pointer',
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
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          },
          thumb: {
            width: 22,
            height: 22,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            '&:hover': disabled ? {} : {
              transform: 'scale(1.1)',
              boxShadow:
                '0 0 0 3px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      />
      <span
        className={`${montserrat_paragraph.variable} text-md ml-3 flex items-center font-montserratParagraph transition-colors duration-200 ease-in-out ${
          !disabled && isContainerHovered ? 'text-white' : 'text-gray-200'
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
              transform: !disabled && isContainerHovered ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconInfoCircle
              size={16}
              className={!disabled && isContainerHovered ? 'text-white' : 'text-gray-400'}
              style={{ transition: 'all 0.2s ease-in-out' }}
            />
          </span>
        </Tooltip>
      </span>
    </div>
  )
}

export default CustomSwitch
