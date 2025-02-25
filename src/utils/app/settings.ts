import { Settings } from '@/types/settings'

const STORAGE_KEY = 'settings'

export const getSettings = (): Settings => {
  let settings: Settings = {
    theme: 'dark', // Force dark mode for all users
    cooldown: 0,
  }
  const settingsJson = localStorage.getItem(STORAGE_KEY)
  if (settingsJson) {
    try {
      const savedSettings = JSON.parse(settingsJson) as Settings
      savedSettings.theme = 'dark' // Override any saved theme settings to force dark mode
      settings = Object.assign(settings, savedSettings)
    } catch (e) {
      console.error(e)
    }
  }
  return settings
}

export const saveSettings = (settings: Settings) => {
  settings.theme = 'dark' // Ensure dark mode is saved for all users
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
