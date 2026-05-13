import { useCallback, useMemo, useState, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, X } from 'lucide-react'
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
  CHATBOT_PROJECT_TYPES,
  CHATBOT_TAG_CATEGORY_LABEL,
  COMMON_ORGANIZATIONS,
  MAX_CHATBOT_TAGS,
  MAX_GENERAL_TAG_LENGTH,
  chatbotTagKey,
  isValidGeneralTagValue,
  sanitizeChatbotTags,
  sanitizeGeneralTagInput,
  type ChatbotTag,
} from '~/types/chatbotTags'
import { useSearchTags } from '~/hooks/queries/useSearchTags'
import type {
  CourseMetadata,
  CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

interface ChatbotTagsEditorProps {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert | CourseMetadata
}

type PickerKind = 'project_type' | 'organization' | null

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

function PickerChip({
  label,
  isOpen,
  disabled,
  onToggle,
}: {
  label: string
  isOpen: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-haspopup="true"
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium text-[--foreground] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isOpen
          ? 'bg-[--dashboard-border]/40 border-[--foreground]'
          : 'hover:bg-[--dashboard-border]/40 border-[--dashboard-border] bg-[--background]'
      }`}
    >
      {label}
      <ChevronDown
        className={`size-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
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
  const [openPicker, setOpenPicker] = useState<PickerKind>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const isFull = tags.length >= MAX_CHATBOT_TAGS

  const hasOrganizationTag = useMemo(
    () => tags.some((t) => t.category === 'organization'),
    [tags],
  )
  const hasProjectTypeTag = useMemo(
    () => tags.some((t) => t.category === 'projectType'),
    [tags],
  )

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

  const addConstrainedTag = useCallback(
    async (
      category: 'projectType' | 'organization',
      value: string,
    ): Promise<boolean> => {
      if (isFull) {
        flashError(
          `Maximum of ${MAX_CHATBOT_TAGS} tags reached. Remove one to add another.`,
        )
        return false
      }
      const alreadyExists =
        category === 'projectType' ? hasProjectTypeTag : hasOrganizationTag
      if (alreadyExists) {
        flashError(
          `You can only have one ${CHATBOT_TAG_CATEGORY_LABEL[category]} tag.`,
        )
        return false
      }
      const ok = await persistTags([...tags, { category, value }])
      return ok
    },
    [
      flashError,
      hasOrganizationTag,
      hasProjectTypeTag,
      isFull,
      persistTags,
      tags,
    ],
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
  const trimmedInput = inputValue.trim()
  const { data: rawSuggestions = [] } = useSearchTags(trimmedInput, {
    category: 'general',
    enabled: isInputFocused && !isFull && trimmedInput.length > 0,
  })
  const suggestions = useMemo(
    () =>
      rawSuggestions.filter(
        (s) =>
          !existingValueKeys.has(`general:${s.value.trim().toLowerCase()}`),
      ),
    [rawSuggestions, existingValueKeys],
  )
  const showSuggestions = isInputFocused && !isFull && suggestions.length > 0

  const togglePicker = useCallback((kind: PickerKind) => {
    setOpenPicker((current) => (current === kind ? null : kind))
    setStatus('idle')
    setErrorMessage(null)
  }, [])

  const closePicker = useCallback(() => setOpenPicker(null), [])

  const handleProjectTypeClick = useCallback(
    async (value: (typeof CHATBOT_PROJECT_TYPES)[number]) => {
      const ok = await addConstrainedTag('projectType', value)
      if (ok) closePicker()
    },
    [addConstrainedTag, closePicker],
  )

  const handleOrganizationClick = useCallback(
    async (value: (typeof COMMON_ORGANIZATIONS)[number]) => {
      const ok = await addConstrainedTag('organization', value)
      if (ok) closePicker()
    },
    [addConstrainedTag, closePicker],
  )

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
        the chatbot hub. Type any tag below, or pick a constrained Project Type
        or Organization from the lists.
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
            className="flex w-full items-center rounded-md border border-[--dashboard-border] bg-[--background] transition-colors focus-within:border-[--foreground] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[--illinois-orange] data-[disabled=true]:opacity-50"
            data-disabled={isFull || undefined}
          >
            <input
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

          {showSuggestions && (
            <ul
              id="chatbot-tag-suggestions"
              role="listbox"
              aria-label="Tag suggestions"
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-auto rounded-md border border-[--dashboard-border] bg-[--background] py-1 shadow-md"
            >
              {suggestions.map((s) => (
                <li key={s.value} role="option" aria-selected={false}>
                  <button
                    type="button"
                    // onMouseDown fires before input blur so the click lands.
                    onMouseDown={(e) => {
                      e.preventDefault()
                      void addGeneralTagWithValue(s.value)
                    }}
                    className="hover:bg-[--dashboard-border]/40 flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm text-[--foreground]"
                  >
                    <span className="truncate">{s.value}</span>
                    <span className="shrink-0 text-xs text-[--foreground-faded]">
                      {s.usage_count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
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

      {/* Constrained pickers */}
      <div
        className="mt-3 flex flex-wrap items-start gap-2"
        role="group"
        aria-label="Constrained tag pickers"
      >
        <div className="flex flex-col gap-2">
          <PickerChip
            label="project_type:"
            isOpen={openPicker === 'project_type'}
            disabled={isFull || hasProjectTypeTag || isSaving}
            onToggle={() => togglePicker('project_type')}
          />
          {openPicker === 'project_type' && (
            <ProjectTypePicker
              disabled={isSaving}
              onPick={handleProjectTypeClick}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <PickerChip
            label="organization:"
            isOpen={openPicker === 'organization'}
            disabled={isFull || hasOrganizationTag || isSaving}
            onToggle={() => togglePicker('organization')}
          />
          {openPicker === 'organization' && (
            <OrganizationPicker
              disabled={isSaving}
              onPick={handleOrganizationClick}
            />
          )}
        </div>
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

function PickerOption({
  label,
  ariaLabel,
  disabled,
  onClick,
}: {
  label: string
  ariaLabel: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="hover:bg-[--dashboard-border]/40 inline-flex items-center rounded-full border border-[--dashboard-border] bg-[--background] px-3 py-1 text-xs font-medium text-[--foreground] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function ProjectTypePicker({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (value: (typeof CHATBOT_PROJECT_TYPES)[number]) => void
}) {
  return (
    <div
      role="group"
      aria-label="Project type options"
      className="bg-[--background-faded]/40 flex flex-wrap gap-2 rounded-md border border-[--dashboard-border] p-2"
    >
      {CHATBOT_PROJECT_TYPES.map((value) => (
        <PickerOption
          key={value}
          label={value}
          ariaLabel={`Add project type ${value}`}
          disabled={disabled}
          onClick={() => onPick(value)}
        />
      ))}
    </div>
  )
}

function OrganizationPicker({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (value: (typeof COMMON_ORGANIZATIONS)[number]) => void
}) {
  return (
    <div
      role="group"
      aria-label="Organization options"
      className="bg-[--background-faded]/40 flex flex-wrap gap-2 rounded-md border border-[--dashboard-border] p-2"
    >
      {COMMON_ORGANIZATIONS.map((value) => (
        <PickerOption
          key={value}
          label={value}
          ariaLabel={`Add organization ${value}`}
          disabled={disabled}
          onClick={() => onPick(value)}
        />
      ))}
    </div>
  )
}
