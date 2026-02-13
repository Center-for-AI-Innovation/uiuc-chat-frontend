import { type Prompt } from '@/types/prompt'
import {
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

function parseVariables(content: string): string[] {
  const regex = /{{(.*?)}}/g
  const foundVariables: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match[1] !== undefined) {
      foundVariables.push(match[1])
    }
  }

  return foundVariables
}

interface UsePromptAutocompleteParams {
  prompts: Prompt[]
  content: string
  setContent: Dispatch<SetStateAction<string>>
}

export function usePromptAutocomplete({
  prompts,
  content,
  setContent,
}: UsePromptAutocompleteParams) {
  const [showPromptList, setShowPromptList] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [promptInputValue, setPromptInputValue] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const promptListRef = useRef<HTMLUListElement | null>(null)

  const filteredPrompts = useMemo(
    () =>
      prompts.filter((prompt) =>
        prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
      ),
    [prompts, promptInputValue],
  )

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/)

    if (match) {
      setShowPromptList(true)
      setPromptInputValue(match[0].slice(1))
    } else {
      setShowPromptList(false)
      setPromptInputValue('')
    }
  }, [])

  const handlePromptSelect = useCallback(
    (prompt: Prompt) => {
      const parsedVariables = parseVariables(prompt.content)
      const filteredVariables = parsedVariables.filter(
        (variable) => variable !== undefined,
      ) as string[]
      setVariables(filteredVariables)

      if (filteredVariables.length > 0) {
        setIsModalVisible(true)
      } else {
        setContent((prevContent) => {
          const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content)
          return updatedContent
        })
        updatePromptListVisibility(prompt.content)
      }
    },
    [setContent, updatePromptListVisibility],
  )

  const handleInitModal = useCallback(() => {
    const selectedPrompt = filteredPrompts[activePromptIndex]
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        )
        return newContent
      })
      handlePromptSelect(selectedPrompt)
    }
    setShowPromptList(false)
  }, [filteredPrompts, activePromptIndex, setContent, handlePromptSelect])

  // Returns true if the event was consumed by prompt navigation
  const handlePromptKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!showPromptList) return false

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        )
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleInitModal()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowPromptList(false)
      } else {
        setActivePromptIndex(0)
      }

      return true
    },
    [showPromptList, prompts.length, handleInitModal],
  )

  // Scroll prompt list to keep active item visible
  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30
    }
  }, [activePromptIndex])

  // Close prompt list on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false)
      }
    }

    window.addEventListener('click', handleOutsideClick)

    return () => {
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const onTextChange = useCallback(
    (value: string) => {
      updatePromptListVisibility(value)
    },
    [updatePromptListVisibility],
  )

  return {
    showPromptList,
    filteredPrompts,
    activePromptIndex,
    setActivePromptIndex,
    promptListRef,
    handleInitModal,
    isModalVisible,
    closeModal,
    variables,
    handlePromptKeyDown,
    handlePromptSelect,
    onTextChange,
  }
}
