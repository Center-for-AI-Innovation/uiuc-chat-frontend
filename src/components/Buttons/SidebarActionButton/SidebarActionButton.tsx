import { MouseEventHandler, ReactElement } from 'react'
import { useTranslation } from 'next-i18next'

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>
  children: ReactElement
  tooltip?: string
}

const SidebarActionButton = ({ handleClick, children, tooltip }: Props) => {
  const { t } = useTranslation('common')
  return (
    <button
      className="min-w-[20px] p-1 text-neutral-400 hover:text-neutral-100"
      onClick={handleClick}
      title={tooltip ? (t(tooltip) || undefined) : undefined}
    >
      {children}
    </button>
  )
}

export default SidebarActionButton
