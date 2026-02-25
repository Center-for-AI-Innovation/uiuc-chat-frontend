import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'

interface UseChatInputFocusParams {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  chatInputParentContainerRef: RefObject<HTMLDivElement | null>
  chatInputContainerRef: RefObject<HTMLDivElement | null>
  inputContent: string
  setContent: Dispatch<SetStateAction<string>>
}

export function useChatInputFocus({
  textareaRef,
  chatInputParentContainerRef,
  chatInputContainerRef,
  inputContent,
  setContent,
}: UseChatInputFocusParams) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = `0 0 2px rgba(42,42,120, 1)`
    }
  }, [chatInputParentContainerRef])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = 'none'
    }
  }, [chatInputParentContainerRef])

  // Focus/blur event listeners on textarea
  useEffect(() => {
    const textArea = textareaRef.current
    textArea?.addEventListener('focus', handleFocus)
    textArea?.addEventListener('blur', handleBlur)

    return () => {
      textArea?.removeEventListener('focus', handleFocus)
      textArea?.removeEventListener('blur', handleBlur)
    }
  }, [textareaRef, handleFocus, handleBlur])

  // Focus the container div on mount
  useEffect(() => {
    if (chatInputContainerRef.current) {
      chatInputContainerRef.current.focus()
    }
  }, [chatInputContainerRef])

  // Sync inputContent prop and focus textarea
  useEffect(() => {
    setContent(inputContent)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [inputContent, textareaRef, setContent])

  return { isFocused, handleFocus, handleBlur }
}
