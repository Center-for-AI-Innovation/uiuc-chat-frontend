import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from '~/contexts/ThemeContext'
import { Tooltip } from '@mantine/core'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Tooltip
      label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      position="bottom"
      withArrow
      arrowSize={6}
      transitionProps={{
        transition: 'fade',
        duration: 200,
      }}
      classNames={{
        tooltip: 'bg-gray-700 text-white text-sm py-1 px-2',
        arrow: 'border-gray-700',
      }}
    >
      <button
        onClick={toggleTheme}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
      </button>
    </Tooltip>
  )
}
