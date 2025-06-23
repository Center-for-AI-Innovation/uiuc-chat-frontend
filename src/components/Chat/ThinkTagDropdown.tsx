import React, { Fragment, useRef, useState } from 'react'
import { IconBrain, IconChevronDown } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'

interface ThinkTagDropdownProps {
  content: string
  isStreaming?: boolean
}

// Extract think tag content helper function
export function extractThinkTagContent(content: string): {
  thoughts: string | null
  remainingContent: string
} {
  if (content.startsWith('<think>')) {
    const endTagIndex = content.indexOf('</think>')
    if (endTagIndex !== -1) {
      // Complete think tag found
      const thoughts = content.slice(7, endTagIndex).trim()
      const remainingContent = content.slice(endTagIndex + 8).trim()
      return { thoughts, remainingContent }
    } else {
      // Incomplete think tag (streaming) - treat all content as thoughts
      const thoughts = content.slice(7).trim()
      return { thoughts, remainingContent: '' }
    }
  }
  return { thoughts: null, remainingContent: content }
}

export const ThinkTagDropdown: React.FC<ThinkTagDropdownProps> = ({
  content,
  isStreaming,
}) => {
  const [isExpanded, setIsExpanded] = useState(true) // open by default
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      className="think-tag-dropdown"
      role="region"
      aria-expanded={isExpanded}
    >
      <div
        ref={headerRef}
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
          {isStreaming && <LoadingSpinner size="xs" />}
          <IconChevronDown
            size={20}
            className={`think-tag-icon ${isExpanded ? 'expanded' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        id="think-tag-content"
        className={`think-tag-content ${isExpanded ? 'expanded' : ''}`}
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
