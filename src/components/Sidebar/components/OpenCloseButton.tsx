import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react'

interface Props {
  onClick: any
  side: 'left' | 'right'
}

export const CloseSidebarButton = ({ onClick, side }: Props) => {
  return (
    <>
      <button
        className={`absolute top-5 ${
          side === 'right' ? 'right-[270px]' : 'left-[270px]'
        } z-50 h-7 w-7 text-[--foreground-faded] hover:text-[--foreground] sm:top-0.5 sm:${
          side === 'right' ? 'right-[270px]' : 'left-[270px]'
        } sm:h-8 sm:w-8`}
        onClick={onClick}
      >
        {side === 'right' ? <IconArrowBarRight /> : <IconArrowBarLeft />}
      </button>
      <div
        onClick={onClick}
        className="absolute left-0 top-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
      ></div>
    </>
  )
}

export const OpenSidebarButton = ({ onClick, side }: Props) => {
  return (
    <button
      data-promptbar-open-button={side === 'right' ? 'true' : 'false'}
      className={`absolute top-2.5 ${
        side === 'right' ? 'right-2' : 'left-2'
      } z-50 h-7 w-7 text-[--foreground-faded] hover:text-[--foreground] sm:top-0.5 sm:${
        side === 'right' ? 'right-2' : 'left-2'
      } sm:h-8 sm:w-8`}
      onClick={onClick}
    >
      {side === 'right' ? <IconArrowBarLeft /> : <IconArrowBarRight />}
    </button>
  )
}
