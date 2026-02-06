import { type RefObject, useCallback, useEffect } from 'react'

const MAX_TEXTAREA_HEIGHT = 400

interface UseTextareaAutosizeParams {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  content: string
  maxHeight?: number
}

export function useTextareaAutosize({
  textareaRef,
  content,
  maxHeight = MAX_TEXTAREA_HEIGHT,
}: UseTextareaAutosizeParams) {
  const adjustHeight = useCallback(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'inherit'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    textareaRef.current.style.overflow =
      textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [textareaRef, maxHeight])

  // Adjust height when content changes
  useEffect(() => {
    adjustHeight()
  }, [content, adjustHeight])

  // ResizeObserver + window resize
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const resizeObserver = new ResizeObserver(adjustHeight)
    resizeObserver.observe(textarea)
    window.addEventListener('resize', adjustHeight)

    adjustHeight()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', adjustHeight)
    }
  }, [adjustHeight, textareaRef])

  const resetHeight = useCallback(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'inherit'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    textareaRef.current.style.overflow =
      textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [textareaRef, maxHeight])

  return { resetHeight }
}
