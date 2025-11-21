import { type MouseEventHandler, type ReactElement } from 'react'

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>
  children: ReactElement
}

const SidebarActionButton = ({ ariaLabel, handleClick, children }: Props) => (
  <button
    aria-label={ariaLabel}
    className="min-w-[20px] p-1 text-[--foreground-faded] hover:text-[--foreground]"
    onClick={handleClick}
  >
    {children}
  </button>
)

export default SidebarActionButton
