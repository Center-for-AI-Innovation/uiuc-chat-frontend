import { IconDeviceLaptop, IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from '~/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[--background-faded] p-1">
      <button
        onClick={() => setTheme('system')}
        className={`rounded-md p-1.5  ${
          theme === 'system'
            ? 'bg-[--background] shadow-sm'
            : 'hover:bg-[--background]'
        }`}
        aria-label="Use system theme"
        title="Set to system theme"
      >
        <IconDeviceLaptop size={16} className="text-[--foreground-faded]" />
      </button>
      <button
        onClick={() => setTheme('light')}
        className={`rounded-md p-1.5 ${
          theme === 'light'
            ? 'bg-[--background] shadow-sm'
            : 'hover:bg-[--background]'
        }`}
        aria-label="Use light theme"
        title="Set to light theme"
      >
        <IconSun size={16} className="text-[--foreground-faded]" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded-md p-1.5 ${
          theme === 'dark'
            ? 'bg-[--background] shadow-sm'
            : 'hover:bg-[--background]'
        }`}
        aria-label="Use dark theme"
        title="Set to dark theme"
      >
        <IconMoon size={16} className="text-[--foreground-faded]" />
      </button>
    </div>
  )
}
