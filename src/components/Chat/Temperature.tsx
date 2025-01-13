import { FC, useContext, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { DEFAULT_TEMPERATURE } from '@/utils/app/const'
import HomeContext from '~/pages/api/home/home.context'
import { Title, Slider } from '@mantine/core' // Import Slider from @mantine/core
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import { AllLLMProviders, GenericSupportedModel } from '~/utils/modelProviders/LLMProvider'

export const selectBestTemperature = (
  lastConversation: { temperature?: number } | undefined,
  selectedModel: GenericSupportedModel | undefined,
  llmProviders: AllLLMProviders,
): number => {
  // First priority: Last conversation temperature
  if (lastConversation?.temperature !== undefined) {
    return lastConversation.temperature
  }

  // Second priority: Selected model temperature
  if (selectedModel?.temperature !== undefined) {
    return selectedModel.temperature
  }

  // Third priority: Default model temperature from LLMProviders
  const defaultModel = Object.values(llmProviders)
    .filter((provider) => provider.enabled)
    .flatMap((provider) => provider.models || [])
    .find((model) => model.default)

  if (defaultModel?.temperature !== undefined) {
    return defaultModel.temperature
  }

  // Final fallback: DEFAULT_TEMPERATURE constant
  return DEFAULT_TEMPERATURE
}

interface Props {
  label: string
  onChangeTemperature: (temperature: number) => void
}

export const TemperatureSlider: FC<Props> = ({
  label,
  onChangeTemperature,
}) => {
  const {
    state: { conversations, llmProviders, selectedConversation },
  } = useContext(HomeContext)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const lastConversation = conversations[conversations.length - 1]
  const [temperature, setTemperature] = useState(
    selectBestTemperature(lastConversation, selectedConversation?.model, llmProviders)
  )
  const { t } = useTranslation('chat')
  const handleChange = (value: number) => {
    setTemperature(value)
    onChangeTemperature(value)
  }

  return (
    <div className="flex flex-col">
      <Title
        className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading md:rounded-lg`}
        color="white"
        order={isSmallScreen ? 5 : 4}
      >
        {label}
      </Title>
      <div className="mx-6 my-4 flex flex-col">
        <span
          className={`mb-1 mt-2 text-center font-bold text-neutral-100 ${isSmallScreen ? 'text-xs' : ''}`}
        >
          {temperature.toFixed(1)}
        </span>
        <Slider // Replace the native input with Mantine Slider
          value={temperature}
          onChange={handleChange}
          min={0}
          max={1}
          step={0.1}
          marks={[
            { value: 0, label: t('Precise') },
            { value: 0.5, label: t('Neutral') },
            { value: 1, label: t('Creative') },
          ]}
          showLabelOnHover
          color="grape"
          className="m-2"
          size={isSmallScreen ? 'xs' : 'md'}
          classNames={{
            markLabel: `mx-2 text-neutral-300 ${montserrat_paragraph.variable} font-montserratParagraph mt-2 ${isSmallScreen ? 'text-xs' : ''}`,
          }}
        />
        <span
          className={`mt-8 text-left text-gray-400 dark:text-white/50 ${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
        >
          {t(
            'Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
          )}
        </span>
      </div>
    </div>
  )
}
