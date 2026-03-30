import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { IconBrain, IconChevronDown } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'

interface ThinkTagDropdownProps {
  content: string
  isReasoningStreaming?: boolean
}

type AnimationMode = 'none' | 'manual' | 'auto'

// Extract think tag content helper function
export function extractThinkTagContent(content: string): {
  thoughts: string | null
  remainingContent: string
} {
  const trimmedContent = content.trimStart()

  if (trimmedContent.startsWith('<think>')) {
    const endTagIndex = trimmedContent.indexOf('</think>')
    if (endTagIndex !== -1) {
      // Complete think tag found
      const thoughts = trimmedContent.slice(7, endTagIndex).trim()
      const remainingContent = trimmedContent.slice(endTagIndex + 8).trim()
      return { thoughts, remainingContent }
    } else {
      // Incomplete think tag (streaming) - treat all content as thoughts
      const thoughts = trimmedContent.slice(7).trim()
      return { thoughts, remainingContent: '' }
    }
  }

  return { thoughts: null, remainingContent: content }
}

export const ThinkTagDropdown: React.FC<ThinkTagDropdownProps> = ({
  content,
  isReasoningStreaming,
}) => {
  const [isExpanded, setIsExpanded] = useState(true) // open by default
  const [animationMode, setAnimationMode] = useState<AnimationMode>('none')
  const [contentHeight, setContentHeight] = useState(0)
  const previousIsReasoningStreamingRef = useRef(isReasoningStreaming)
  const hasAutoCollapsedRef = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Function to process the content and preserve formatting
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => (
      <Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </Fragment>
    ))
  }

  const toggleExpanded = () => {
    setAnimationMode('manual')
    setIsExpanded(!isExpanded)
  }

  // Handle header click
  const handleHeaderClick = () => {
    toggleExpanded()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpanded()
    } else if (e.key === 'Escape' && isExpanded) {
      e.preventDefault()
      setIsExpanded(false)
    }
  }

  useLayoutEffect(() => {
    if (!contentRef.current) {
      return
    }

    setContentHeight(contentRef.current.scrollHeight)
  }, [content, isExpanded])

  useEffect(() => {
    const wasReasoningStreaming = previousIsReasoningStreamingRef.current
    const reasoningStreamingJustFinished =
      Boolean(wasReasoningStreaming) && !isReasoningStreaming

    if (reasoningStreamingJustFinished && !hasAutoCollapsedRef.current) {
      setAnimationMode('auto')
      hasAutoCollapsedRef.current = true
      const animationFrameId = requestAnimationFrame(() => {
        setIsExpanded(false)
      })
      previousIsReasoningStreamingRef.current = isReasoningStreaming
      return () => cancelAnimationFrame(animationFrameId)
    }

    previousIsReasoningStreamingRef.current = isReasoningStreaming
  }, [isReasoningStreaming])

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === 'max-height' &&
      !isExpanded &&
      animationMode === 'auto'
    ) {
      setAnimationMode('manual')
    }
  }

  const animationClassName =
    animationMode === 'auto'
      ? 'animate-auto'
      : animationMode === 'manual'
        ? 'animate-manual'
        : 'no-animate'
  const isClosing = !isExpanded && animationMode !== 'none'

  return (
    <div className="think-tag-dropdown" role="region">
      <div
        className="think-tag-header"
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls="think-tag-content"
      >
        <div className="flex items-center gap-2">
          <IconBrain size={20} className="think-tag-brain-icon" />
          <span
            id="ai-thought-process-label"
            className={`text-base font-medium ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            AI&apos;s Thought Process
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isReasoningStreaming && <LoadingSpinner size="xs" />}
          <IconChevronDown
            size={20}
            className={`think-tag-icon ${isExpanded ? 'expanded' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        id="think-tag-content"
        className={`think-tag-content ${animationClassName} ${isClosing ? 'closing' : ''} ${
          isExpanded ? 'expanded' : ''
        }`}
        style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
        onTransitionEnd={handleTransitionEnd}
        role="region"
        aria-hidden={!isExpanded}
        aria-labelledby="ai-thought-process-label"
      >
        <div
          ref={contentRef}
          className={`whitespace-pre-line text-base ${montserrat_paragraph.variable} font-montserratParagraph`}
          tabIndex={isExpanded ? 0 : -1}
        >
          {formatContent(content)}
        </div>
      </div>
    </div>
  )
}

export default ThinkTagDropdown
