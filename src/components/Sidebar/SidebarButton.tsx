import { FC } from 'react'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'

interface Props {
  text: string
  icon: JSX.Element
  onClick: () => void
  loading?: boolean
}

export const SidebarButton: FC<Props> = ({ text, icon, onClick, loading }) => {
  return (
    <button
      className="relative flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-3 py-3 text-[14px] leading-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{text}</span>
      </div>
      {loading && (
        <div className="absolute right-2">
          <LoadingSpinner size="xs" />
        </div>
      )}
    </button>
  )
}
