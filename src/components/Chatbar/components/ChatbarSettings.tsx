import { IconFileExport } from '@tabler/icons-react'
import { useContext } from 'react'

import { useTranslation } from 'next-i18next'

import HomeContext from '~/pages/api/home/home.context'

import { SidebarButton } from '../../Sidebar/SidebarButton'
import { ThemeToggle } from '../../UIUC-Components/ThemeToggle'
import ChatbarContext from '../Chatbar.context'
import { ClearConversations } from './ClearConversations'

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar')

  const {
    state: { conversations },
  } = useContext(HomeContext)

  const { handleClearConversations, handleExportData, isExporting } =
    useContext(ChatbarContext)

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-[--dashboard-border] pt-1 text-sm">
      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <SidebarButton
        ariaLabel={t('Export history')}
        text={t('Export history')}
        icon={<IconFileExport size={18} aria-hidden="true" />}
        onClick={() => handleExportData()}
        loading={isExporting}
      />

      {/* Theme Toggle */}
      <div className="mt-auto w-full border-t border-[--dashboard-border] pt-4">
        <div className="flex w-full items-center justify-center rounded-lg px-2 py-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
