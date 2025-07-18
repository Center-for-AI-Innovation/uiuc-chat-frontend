import { KeyValuePair } from './data'

export interface Plugin {
  id: PluginID
  name: PluginName
  requiredKeys: KeyValuePair[]
}

export interface PluginKey {
  pluginId: PluginID
  requiredKeys: KeyValuePair[]
}

export enum PluginID {
  GOOGLE_SEARCH = 'google-search',
  EXA_SEARCH = 'exa-search',
}

export enum PluginName {
  GOOGLE_SEARCH = 'Google Search',
  EXA_SEARCH = 'Exa Web Search',
}

export const Plugins: Record<PluginID, Plugin> = {
  [PluginID.GOOGLE_SEARCH]: {
    id: PluginID.GOOGLE_SEARCH,
    name: PluginName.GOOGLE_SEARCH,
    requiredKeys: [
      {
        key: 'GOOGLE_API_KEY',
        value: '',
      },
      {
        key: 'GOOGLE_CSE_ID',
        value: '',
      },
    ],
  },
  [PluginID.EXA_SEARCH]: {
    id: PluginID.EXA_SEARCH,
    name: PluginName.EXA_SEARCH,
    requiredKeys: [
      {
        key: 'EXA_API_KEY',
        value: '',
      },
    ],
  },
}

export const PluginList = Object.values(Plugins)
