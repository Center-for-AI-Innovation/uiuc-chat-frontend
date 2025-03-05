import { IconDeviceLaptop, IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from '~/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      <button
        onClick={() => setTheme('system')}
        className={`rounded-md p-1.5 ${
          theme === 'system'
            ? 'bg-white shadow-sm dark:bg-gray-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Use system theme"
        title="Set to system theme"
      >
        <IconDeviceLaptop
          size={18}
          className="text-gray-600 dark:text-gray-400"
        />
      </button>
      <button
        onClick={() => setTheme('light')}
        className={`rounded-md p-1.5 ${
          theme === 'light'
            ? 'bg-white shadow-sm dark:bg-gray-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Use light theme"
        title="Set to light theme"
      >
        <IconSun size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded-md p-1.5 ${
          theme === 'dark'
            ? 'bg-white shadow-sm dark:bg-gray-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label="Use dark theme"
        title="Set to dark theme"
      >
        <IconMoon size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  )
}
