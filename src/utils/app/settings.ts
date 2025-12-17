import { Settings } from '@/types/settings'

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  cooldown: 10,
}

const SETTINGS_KEY = 'settings'

export const getSettings = (): Settings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  const settings = localStorage.getItem(SETTINGS_KEY)
  return settings ? JSON.parse(settings) : DEFAULT_SETTINGS
}

export const saveSettings = (settings: Settings): void => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
