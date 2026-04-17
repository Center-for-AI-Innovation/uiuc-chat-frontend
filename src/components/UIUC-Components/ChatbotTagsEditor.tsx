import { useCallback, useMemo, useState, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sparkles, X } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import { Spinner } from '@/components/shadcn/ui/spinner'

import {
  CHATBOT_PROJECT_TYPES,
  CHATBOT_TAG_CATEGORY_LABEL,
  COMMON_ORGANIZATIONS,
  MAX_CHATBOT_TAGS,
  categorizeTagValue,
  chatbotTagKey,
  sanitizeChatbotTags,
  type ChatbotTag,
} from '~/types/chatbotTags'
import type {
  CourseMetadata,
  CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

interface ChatbotTagsEditorProps {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert | CourseMetadata
}

const TAG_DATALIST_ID = 'chatbot-tag-suggestions'

function TagBadge({
  tag,
  onRemove,
  disabled,
}: {
  tag: ChatbotTag
  onRemove: () => void
  disabled: boolean
}) {
  const isSpecial = tag.category === 'projectType'
  const wrapperClass = isSpecial
    ? 'inline-flex items-center gap-1.5 rounded-full border border-[--illinois-prairie]/40 bg-[--illinois-prairie]/10 px-3 py-1 text-xs text-[--illinois-prairie]'
    : 'inline-flex items-center gap-1.5 rounded-full border border-[--dashboard-border] bg-[--background] px-3 py-1 text-xs text-[--foreground]'

  const removeClass = isSpecial
    ? 'ml-1 rounded-full p-0.5 text-[--illinois-prairie] transition-colors hover:bg-[--illinois-prairie]/15'
    : 'ml-1 rounded-full p-0.5 text-[--foreground-faded] transition-colors hover:bg-[--error]/10 hover:text-[--error]'

  return (
    <span role="listitem" className={wrapperClass}>
      {isSpecial && <Sparkles className="size-3" aria-hidden="true" />}
      <span className="font-medium">
        {isSpecial ? `${CHATBOT_TAG_CATEGORY_LABEL.projectType}: ` : ''}
        {tag.value}
      </span>
      <button
        type="button"
        aria-label={`Remove tag ${CHATBOT_TAG_CATEGORY_LABEL[tag.category]}: ${
          tag.value
        }`}
        className={removeClass}
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

export default function ChatbotTagsEditor({
  course_name,
  course_metadata,
}: ChatbotTagsEditorProps) {
  const queryClient = useQueryClient()

  const tags = useMemo(
    () => sanitizeChatbotTags(course_metadata.tags),
    [course_metadata.tags],
  )

  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isFull = tags.length >= MAX_CHATBOT_TAGS

  const persistTags = useCallback(
    async (nextTags: ChatbotTag[]) => {
      setStatus('saving')
      setErrorMessage(null)

      const ok = await callSetCourseMetadata(course_name, {
        ...course_metadata,
        tags: nextTags,
      })

      if (!ok) {
        setStatus('error')
        setErrorMessage('Failed to save tags. Please try again.')
        return false
      }

      queryClient.setQueryData(
        ['courseMetadata', course_name],
        (prev: CourseMetadata | undefined) =>
          prev ? { ...prev, tags: nextTags } : prev,
      )
      setStatus('idle')
      return true
    },
    [course_name, course_metadata, queryClient],
  )

  const addTag = useCallback(async () => {
    if (isFull) return

    const candidate = categorizeTagValue(inputValue)
    if (!candidate) {
      setStatus('error')
      setErrorMessage('Enter a tag name.')
      return
    }

    const existingInCategory = tags.find(
      (existing) => existing.category === candidate.category,
    )
    if (existingInCategory) {
      setStatus('error')
      setErrorMessage(
        existingInCategory.value === candidate.value
          ? 'That tag is already added.'
          : `You can only have one ${
              CHATBOT_TAG_CATEGORY_LABEL[candidate.category]
            } tag. Remove "${existingInCategory.value}" to change it.`,
      )
      return
    }

    const ok = await persistTags([...tags, candidate])
    if (ok) setInputValue('')
  }, [inputValue, isFull, persistTags, tags])

  const removeTag = useCallback(
    async (target: ChatbotTag) => {
      const targetKey = chatbotTagKey(target)
      const next = tags.filter(
        (existing) => chatbotTagKey(existing) !== targetKey,
      )
      await persistTags(next)
    },
    [persistTags, tags],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void addTag()
    }
  }

  return (
    <div className="chatbot_tags form-control">
      <div className="mb-3 mt-6 font-semibold">Tags</div>
      <div className="mb-3 text-sm text-[--foreground-faded]">
        Add up to {MAX_CHATBOT_TAGS} tags to help people discover your bot in
        the chatbot hub. Project-type tags (Course, Department, etc.) are
        highlighted; organization tags take precedence when sorting results.
      </div>

      <div
        className="mb-3 flex flex-wrap gap-2"
        aria-label="Selected tags"
        role="list"
      >
        {tags.length === 0 ? (
          <span className="text-sm text-[--foreground-faded]">
            No tags yet.
          </span>
        ) : (
          tags.map((tag) => (
            <TagBadge
              key={chatbotTagKey(tag)}
              tag={tag}
              onRemove={() => removeTag(tag)}
              disabled={status === 'saving'}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div
          className="flex w-full flex-1 items-center rounded-md border border-[--dashboard-border] bg-[--background] transition-colors focus-within:border-[--foreground] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[--illinois-orange] data-[disabled=true]:opacity-50"
          data-disabled={isFull || undefined}
        >
          <input
            type="text"
            list={TAG_DATALIST_ID}
            placeholder="Type a tag, e.g. Course or Grainger Engineering"
            aria-label="Tag"
            value={inputValue}
            disabled={isFull}
            className="w-full bg-transparent px-3 py-2 text-sm text-[--foreground] outline-none placeholder:text-[--foreground-faded] disabled:cursor-not-allowed"
            onChange={(e) => {
              setInputValue(e.target.value)
              setStatus('idle')
              setErrorMessage(null)
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <datalist id={TAG_DATALIST_ID}>
          {CHATBOT_PROJECT_TYPES.map((option) => (
            <option
              key={`pt-${option}`}
              value={option}
              label={CHATBOT_TAG_CATEGORY_LABEL.projectType}
            />
          ))}
          {COMMON_ORGANIZATIONS.map((option) => (
            <option
              key={`org-${option}`}
              value={option}
              label={CHATBOT_TAG_CATEGORY_LABEL.organization}
            />
          ))}
        </datalist>

        <Button
          type="button"
          variant="dashboard"
          size="sm"
          onClick={addTag}
          disabled={isFull || status === 'saving'}
          aria-label="Add tag"
        >
          {status === 'saving' ? <Spinner className="size-4" /> : 'Add tag'}
        </Button>
      </div>

      {isFull && (
        <div className="mt-2 text-xs text-[--foreground-faded]">
          Maximum of {MAX_CHATBOT_TAGS} tags reached. Remove one to add another.
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div
          className="mt-2 text-xs text-[--error]"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </div>
  )
}
