import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Text } from '@mantine/core'
import { Montserrat } from 'next/font/google'
import { montserrat_heading } from 'fonts'

import { Button } from '@/components/shadcn/ui/button'
import { Spinner } from '@/components/shadcn/ui/spinner'

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

import {
  CHATBOT_TAG_CATEGORY_LABEL,
  MAX_CHATBOT_TAGS,
  MAX_GENERAL_TAG_LENGTH,
  chatbotTagKey,
  isValidGeneralTagValue,
  sanitizeChatbotTags,
  sanitizeGeneralTagInput,
  type ChatbotTag,
} from '~/types/chatbotTags'
import { useSearchTags } from '~/hooks/queries/useSearchTags'
import { useDebounce } from '~/hooks/useDebounce'
import type {
  CourseMetadata,
  CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

interface ChatbotTagsEditorProps {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert | CourseMetadata
}

function TagBadge({
  tag,
  onRemove,
  disabled,
}: {
  tag: ChatbotTag
  onRemove: () => void
  disabled: boolean
}) {
  return (
    <span
      role="listitem"
      className="inline-flex items-center gap-1.5 rounded-full border border-[--dashboard-border] bg-[--background] px-3 py-1 text-xs text-[--foreground]"
    >
      <span className="font-medium">{tag.value}</span>
      <button
        type="button"
        aria-label={`Remove tag ${CHATBOT_TAG_CATEGORY_LABEL[tag.category]}: ${
          tag.value
        }`}
        className="hover:bg-[--error]/10 ml-1 rounded-full p-0.5 text-[--foreground-faded] transition-colors hover:text-[--error]"
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

  // Local copy of the attached tag list. We seed it from the incoming
  // course_metadata prop and re-sync whenever that prop changes (so an
  // external edit, e.g. via the parent's cache subscription, still shows
  // up here), but persistTags also updates this locally and immediately
  // so the badges row reflects a save even if the parent's prop refresh
  // is delayed for any reason.
  const propTags = useMemo(
    () => sanitizeChatbotTags(course_metadata.tags),
    [course_metadata.tags],
  )
  const [tags, setTags] = useState<ChatbotTag[]>(propTags)
  useEffect(() => {
    setTags(propTags)
  }, [propTags])

  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const isFull = tags.length >= MAX_CHATBOT_TAGS

  // Lowercased existing tag values for case-insensitive duplicate checks.
  const existingValueKeys = useMemo(
    () =>
      new Set(tags.map((t) => `${t.category}:${t.value.trim().toLowerCase()}`)),
    [tags],
  )

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

      // Local state first so the badges row updates immediately, even
      // before the parent's cache subscription notices the change.
      setTags(nextTags)
      queryClient.setQueryData(
        ['courseMetadata', course_name],
        (prev: CourseMetadata | undefined) =>
          prev
            ? { ...prev, tags: nextTags }
            : { ...course_metadata, tags: nextTags },
      )
      setStatus('idle')
      return true
    },
    [course_name, course_metadata, queryClient],
  )

  const flashError = useCallback((message: string) => {
    setStatus('error')
    setErrorMessage(message)
  }, [])

  const addGeneralTagWithValue = useCallback(
    async (rawValue: string) => {
      if (isFull) return
      const trimmed = rawValue.trim()
      if (!trimmed) {
        flashError('Enter a tag name.')
        return
      }
      if (!isValidGeneralTagValue(trimmed)) {
        flashError(
          `Tags can only contain letters, numbers, spaces, hyphens and underscores (max ${MAX_GENERAL_TAG_LENGTH} characters).`,
        )
        return
      }
      const key = `general:${trimmed.toLowerCase()}`
      if (existingValueKeys.has(key)) {
        flashError('That tag is already added.')
        return
      }

      const ok = await persistTags([
        ...tags,
        { category: 'general', value: trimmed },
      ])
      if (ok) setInputValue('')
    },
    [existingValueKeys, flashError, isFull, persistTags, tags],
  )

  const addGeneralTag = useCallback(
    () => addGeneralTagWithValue(inputValue),
    [addGeneralTagWithValue, inputValue],
  )

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
      void addGeneralTag()
    }
  }

  // Autocomplete suggestions for the free-text general-tag input.
  // The query input is debounced so we don't fire a network request on
  // every keystroke; ~200ms feels responsive without being chatty.
  const trimmedInput = inputValue.trim()
  const debouncedQuery = useDebounce(trimmedInput, 200)
  const { data: rawSuggestions = [] } = useSearchTags(debouncedQuery, {
    category: 'general',
    enabled: isInputFocused && !isFull && debouncedQuery.length > 0,
  })
  // Annotate (don't drop) already-attached tags so the user sees the
  // registry actually has them — just disabled so they can't re-add.
  const suggestions = useMemo(
    () =>
      rawSuggestions.map((s) => ({
        ...s,
        alreadyAdded: existingValueKeys.has(
          `general:${s.value.trim().toLowerCase()}`,
        ),
      })),
    [rawSuggestions, existingValueKeys],
  )
  const showSuggestions = isInputFocused && !isFull && suggestions.length > 0

  // Portal the dropdown to <body> so ancestor overflow:hidden (cards,
  // modals, etc.) can't clip it. Position is recomputed from the input
  // rect whenever the dropdown opens or the viewport changes.
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dropdownRect, setDropdownRect] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  useLayoutEffect(() => {
    if (!showSuggestions || !inputRef.current) {
      setDropdownRect(null)
      return
    }

    const updateRect = () => {
      const node = inputRef.current
      if (!node) return
      const r = node.getBoundingClientRect()
      setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [showSuggestions])

  const isSaving = status === 'saving'

  return (
    <div className="chatbot_tags form-control">
      <label
        className={`label ${montserrat_heading.variable} font-montserratHeading`}
      >
        <span className="label-text-unused text-lg">Tags</span>
      </label>
      <Text size={'sm'} className={`label !mt-0 ${montserrat_light.className}`}>
        Add up to {MAX_CHATBOT_TAGS} tags to help people discover your bot in
        the chatbot hub. Project Type and Organization are set when you create
        the chatbot.
      </Text>

      <div
        className="mt-2 flex flex-wrap gap-2"
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
              disabled={isSaving}
            />
          ))
        )}
      </div>

      {/* Free-text input → general tag */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="relative w-full flex-1">
          <div
            className="flex w-full items-center rounded-md border border-[--dashboard-border] bg-[--background] transition-colors focus-within:border-[--illinois-orange] data-[disabled=true]:opacity-50"
            data-disabled={isFull || undefined}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={`Letters, numbers, space — up to ${MAX_GENERAL_TAG_LENGTH} chars`}
              aria-label="Tag"
              value={inputValue}
              disabled={isFull}
              maxLength={MAX_GENERAL_TAG_LENGTH}
              role="combobox"
              aria-expanded={showSuggestions}
              aria-autocomplete="list"
              aria-controls="chatbot-tag-suggestions"
              className="w-full bg-transparent px-3 py-2 text-sm text-[--foreground] outline-none placeholder:text-[--foreground-faded] disabled:cursor-not-allowed"
              onChange={(e) => {
                setInputValue(sanitizeGeneralTagInput(e.target.value))
                setStatus('idle')
                setErrorMessage(null)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              // Delay so onMouseDown on a suggestion fires before blur.
              onBlur={() =>
                window.setTimeout(() => setIsInputFocused(false), 120)
              }
            />
          </div>

          {showSuggestions &&
            dropdownRect &&
            typeof document !== 'undefined' &&
            createPortal(
              <ul
                id="chatbot-tag-suggestions"
                role="listbox"
                aria-label="Tag suggestions"
                style={{
                  position: 'fixed',
                  top: dropdownRect.top,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                }}
                className="z-[1000] m-0 max-h-56 list-none overflow-auto rounded-md border border-[--dashboard-border] bg-[--background] p-1 shadow-md"
              >
                {suggestions.map((s) => (
                  <li key={s.value} role="option" aria-selected={false}>
                    <button
                      type="button"
                      disabled={s.alreadyAdded}
                      // onMouseDown fires before input blur so the click lands.
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (s.alreadyAdded) return
                        void addGeneralTagWithValue(s.value)
                      }}
                      className="enabled:hover:bg-[--dashboard-border]/40 flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1 text-left text-sm leading-tight text-[--foreground] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="truncate">{s.value}</span>
                      <span className="shrink-0 text-xs text-[--foreground-faded]">
                        {s.alreadyAdded ? 'added' : s.usage_count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>,
              document.body,
            )}
        </div>

        <Button
          type="button"
          variant="dashboard"
          size="sm"
          onClick={addGeneralTag}
          disabled={isFull || isSaving}
          aria-label="Add tag"
        >
          {isSaving ? <Spinner className="size-4" /> : 'Add tag'}
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
