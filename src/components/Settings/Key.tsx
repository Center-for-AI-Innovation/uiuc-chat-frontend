import { IconCheck, IconKey, IconX } from '@tabler/icons-react'
import { type FC, type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { useTranslation } from 'next-i18next'

import { SidebarButton } from '../Sidebar/SidebarButton'

interface Props {
  apiKey: string
  onApiKeyChange: (apiKey: string) => void
}

export const Key: FC<Props> = ({ apiKey, onApiKeyChange }) => {
  const { t } = useTranslation('sidebar')
  const [isChanging, setIsChanging] = useState(false)
  const [newKey, setNewKey] = useState(apiKey)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUpdateKey(newKey)
    }
  }

  const handleUpdateKey = (newKey: string) => {
    onApiKeyChange(newKey.trim())
    setIsChanging(false)
  }

  useEffect(() => {
    if (isChanging) {
      inputRef.current?.focus()
    }
  }, [isChanging])

  return isChanging ? (
    <div className="duration:200 flex w-full cursor-pointer items-center rounded-md px-3 py-3 transition-colors hover:bg-gray-500/10">
      <IconKey size={18} aria-hidden="true" />

      <input
        ref={inputRef}
        className="ml-2 h-[20px] flex-1 overflow-hidden overflow-ellipsis border-b border-neutral-400 bg-transparent pr-1 text-left text-[12.5px] leading-3 text-white outline-none focus:border-neutral-100"
        type="password"
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        onKeyDown={handleEnterDown}
        placeholder={t('API Key') || 'API Key'}
      />

      <div className="flex w-[40px]">
        <IconCheck
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            handleUpdateKey(newKey)
          }}
          aria-label="Update API Key"
        />

        <IconX
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            setIsChanging(false)
            setNewKey(apiKey)
          }}
          aria-label="Cancel Update API Key"
        />
      </div>
    </div>
  ) : (
    <SidebarButton
      ariaLabel={t('OpenAI API Key')}
      text={t('OpenAI API Key')}
      icon={<IconKey size={18} aria-hidden="true" />}
      onClick={() => setIsChanging(true)}
    />
  )
}
