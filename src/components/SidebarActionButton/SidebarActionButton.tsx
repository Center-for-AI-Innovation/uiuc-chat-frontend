import { type MouseEventHandler, type ReactElement } from 'react'

interface Props {
  handleClick: MouseEventHandler<HTMLButtonElement>
  children: ReactElement
  tooltip?: string
}

const SidebarActionButton = ({ handleClick, children, tooltip }: Props) => (
  <button
    className="min-w-[20px] p-1 text-neutral-400 hover:text-neutral-100"
    onClick={handleClick}
    title={tooltip}
  >
    {children}
  </button>
)

export default SidebarActionButton
