import { Plugin, PluginID } from '@/types/plugin'

export const getEndpoint = (plugin: Plugin | null) => {
  if (!plugin) {
    return '../api/chat'
  }

  if (plugin.id === PluginID.GOOGLE_SEARCH) {
    return '../api/google'
  }
  if (plugin.id === PluginID.EXA_SEARCH) {
    return '../api/exa-search'
  }

  return '../api/chat'
}
