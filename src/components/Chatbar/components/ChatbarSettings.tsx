import { IconFileExport, IconSettings } from '@tabler/icons-react'
import { useContext, useState } from 'react'

import { useTranslation } from 'next-i18next'

import HomeContext from '~/pages/api/home/home.context'

import { Key } from '../../Settings/Key'
import { SidebarButton } from '../../Sidebar/SidebarButton'
import ChatbarContext from '../Chatbar.context'
import { ClearConversations } from './ClearConversations'

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar')
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false)

  const {
    state: {
      apiKey,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const {
    handleClearConversations,
    handleExportData,
    handleApiKeyChange,
    isExporting,
  } = useContext(ChatbarContext)

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-[--dashboard-border] pt-1 text-sm">
      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <SidebarButton
        text={t('Export history')}
        icon={<IconFileExport size={18} />}
        onClick={() => handleExportData()}
        loading={isExporting}
      />

      {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      ) : null}
    </div>
  )
}
