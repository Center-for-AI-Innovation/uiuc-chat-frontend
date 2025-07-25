import { useState } from 'react'
// import { ModelSelect } from './ModelSelect'
import { TemperatureSlider } from './Temperature'
import { createStyles } from '@mantine/core'
import { useTranslation } from 'next-i18next'

const useStyles = createStyles((theme) => ({
  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      // boxShadow: theme.shadows.xl,
      // borderRadius: theme.radius.lg,
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(90deg)',
    },
  },
}))

interface ModelParamsProps {
  selectedConversation: any // Replace 'any' with the appropriate type
  prompts: any // Replace 'any' with the appropriate type
  handleUpdateConversation: (
    conversation: any,
    update: { key: string; value: any },
  ) => void // Replace 'any' with the appropriate types
  t: (key: string) => string
}

export const ModelParams = ({
  selectedConversation,
  prompts,
  handleUpdateConversation,
  t,
}: ModelParamsProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const { classes } = useStyles() // for Accordion
  const { t: tCommon } = useTranslation('common')

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked)
  }

  return (
    <div className="backdrop-filter-[blur(10px)] w-full rounded-lg ">
      <div className="flex h-full flex-col space-y-4 rounded-lg p-4">
        <TemperatureSlider
          label={tCommon('temperature')}
          onChangeTemperature={(temperature) =>
            handleUpdateConversation(selectedConversation, {
              key: 'temperature',
              value: temperature,
            })
          }
        />
      </div>
    </div>
  )
}
