import { type FC, type MutableRefObject } from 'react'

import { type Prompt } from '@/types/prompt'

interface Props {
  prompts: Prompt[]
  activePromptIndex: number
  onSelect: () => void
  onMouseOver: (index: number) => void
  promptListRef: MutableRefObject<HTMLUListElement | null>
}

export const PromptList: FC<Props> = ({
  prompts,
  activePromptIndex,
  onSelect,
  onMouseOver,
  promptListRef,
}) => {
  return (
    <ul
      ref={promptListRef}
      role="listbox"
      aria-label="Available prompts"
      className="z-10 max-h-52 w-full overflow-scroll rounded border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-neutral-500 dark:bg-[#343541] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
    >
      {prompts.map((prompt, index) => (
        <li
          key={prompt.id}
          role="option"
          aria-selected={index === activePromptIndex}
          tabIndex={index === activePromptIndex ? 0 : -1}
          className={`${
            index === activePromptIndex
              ? 'bg-gray-200 dark:bg-[#202123] dark:text-black'
              : ''
          } cursor-pointer px-3 py-2 text-sm text-black dark:text-white`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect()
          }}
          onMouseEnter={() => onMouseOver(index)}
          onFocus={() => onMouseOver(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onSelect()
            }
          }}
        >
          {prompt.name}
        </li>
      ))}
    </ul>
  )
}
