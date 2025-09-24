import { type MouseEventHandler, type ReactElement } from 'react'

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>
  children: ReactElement
  tooltip?: string
}

const SidebarActionButton = ({ handleClick, children, tooltip }: Props) => (
  <button
    className="min-w-[20px] p-1 text-[--foreground-faded] hover:text-[--foreground]"
    onClick={handleClick}
    title={tooltip}
  >
    {children}
  </button>
)

export default SidebarActionButton
