import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Trash2 } from 'lucide-react'

import { FormInput } from '@/components/shadcn/ui/form-input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip'
import { Spinner } from '@/components/shadcn/ui/spinner'

import { useQueryClient } from '@tanstack/react-query'
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

interface QuestionState {
  value: string
  status: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage?: string
}

export default function SetExampleQuestions({
  course_name,
  course_metadata,
  onStepLeave,
}: {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert
  onStepLeave?: (callback: () => Promise<void>) => void
}) {
  const queryClient = useQueryClient()
  const example_questions = course_metadata?.example_questions || []

  const updateCache = useCallback(
    (newQuestions: string[]) => {
      queryClient.setQueryData(
        ['courseMetadata', course_name],
        (prev: CourseMetadataOptionalForUpsert | undefined) =>
          prev ? { ...prev, example_questions: newQuestions } : prev,
      )
    },
    [queryClient, course_name],
  )
  const [questions, setQuestions] = useState<QuestionState[]>(() => {
    if (example_questions.length > 0) {
      return [
        ...example_questions.map((q) => ({
          value: q,
          status: 'saved' as const,
        })),
        // Always include an empty placeholder at the end
        { value: '', status: 'idle' as const },
      ]
    }
    return [{ value: '', status: 'idle' as const }]
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Keep a ref to the latest questions so callbacks never read stale state
  const questionsRef = useRef(questions)
  questionsRef.current = questions

  // Track original values to detect changes
  const originalValuesRef = useRef<string[]>(
    example_questions.length > 0 ? [...example_questions] : [],
  )

  // Register step leave callback
  useEffect(() => {
    const saveAllQuestions = async (): Promise<boolean> => {
      const latestQuestions = questionsRef.current
      const validQuestions = latestQuestions
        .map((q) => q.value.trim())
        .filter((q) => q !== '')

      try {
        const success = await callSetCourseMetadata(course_name, {
          ...course_metadata,
          example_questions: validQuestions,
        })

        if (success) {
          originalValuesRef.current = validQuestions
          updateCache(validQuestions)
          setQuestions((prev) =>
            prev.map((q) => ({
              ...q,
              status: q.value.trim() !== '' ? 'saved' : 'idle',
              errorMessage: undefined,
            })),
          )
          return true
        } else {
          throw new Error('Failed to save questions')
        }
      } catch (error) {
        return false
      }
    }

    const saveAllPendingQuestions = async () => {
      const latestQuestions = questionsRef.current
      const questionsToSave = latestQuestions.filter(
        (q, i) =>
          q.value.trim() !== '' &&
          q.status !== 'saved' &&
          q.value !== originalValuesRef.current[i],
      )

      if (questionsToSave.length > 0) {
        await saveAllQuestions()
      }
    }

    if (onStepLeave) {
      onStepLeave(async () => {
        await saveAllPendingQuestions()
      })
    }
  }, [onStepLeave, course_name, course_metadata, updateCache])

  const saveQuestion = useCallback(
    async (index: number, currentValue?: string) => {
      const latestQuestions = questionsRef.current
      const question = latestQuestions[index]
      if (!question) return

      // Use the passed-in value (from the DOM) if provided, otherwise fall back to state
      const trimmedValue = (currentValue ?? question.value).trim()

      // Skip if empty or unchanged
      if (
        trimmedValue === '' ||
        trimmedValue === originalValuesRef.current[index]
      ) {
        if (trimmedValue !== '' && question.status !== 'saved') {
          setQuestions((prev) =>
            prev.map((q, i) => (i === index ? { ...q, status: 'saved' } : q)),
          )
        }
        return
      }

      // Set saving status
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === index ? { ...q, status: 'saving', errorMessage: undefined } : q,
        ),
      )

      // Get all valid questions for the save, using the current value for this index
      const allQuestions = latestQuestions
        .map((q, i) => (i === index ? trimmedValue : q.value.trim()))
        .filter((q) => q !== '')

      try {
        const success = await callSetCourseMetadata(course_name, {
          ...course_metadata,
          example_questions: allQuestions,
        })

        if (success) {
          // Update original values ref
          originalValuesRef.current = allQuestions
          updateCache(allQuestions)
          setQuestions((prev) =>
            prev.map((q, i) =>
              i === index
                ? { ...q, status: 'saved', errorMessage: undefined }
                : q,
            ),
          )
        } else {
          throw new Error('Failed to save question')
        }
      } catch (error) {
        setQuestions((prev) =>
          prev.map((q, i) =>
            i === index
              ? {
                  ...q,
                  status: 'error',
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : 'Failed to save question',
                }
              : q,
          ),
        )
      }
    },
    [course_name, course_metadata, updateCache],
  )

  const deleteQuestion = async (index: number) => {
    const newQuestions = questionsRef.current.filter((_, i) => i !== index)
    const validQuestions = newQuestions
      .map((q) => q.value.trim())
      .filter((q) => q !== '')

    // Set the question being deleted to saving state
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, status: 'saving' } : q)),
    )

    try {
      const success = await callSetCourseMetadata(course_name, {
        ...course_metadata,
        example_questions: validQuestions,
      })

      if (success) {
        originalValuesRef.current = validQuestions
        updateCache(validQuestions)
        // Keep at least one empty input field
        setQuestions(
          newQuestions.length > 0
            ? newQuestions
            : [{ value: '', status: 'idle' }],
        )
      } else {
        throw new Error('Failed to delete question')
      }
    } catch (error) {
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === index
            ? {
                ...q,
                status: 'error',
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : 'Failed to delete question',
              }
            : q,
        ),
      )
    }
  }

  const handleInputChange = (value: string, index: number) => {
    setQuestions((prev) => {
      const updated = prev.map((q, i) =>
        i === index
          ? { ...q, value, status: 'idle' as const, errorMessage: undefined }
          : q,
      )

      // When user starts typing, ensure there's an empty input at the end
      const hasEmptyAfter = updated
        .slice(index + 1)
        .some((q) => q.value.trim() === '')
      if (value.trim() !== '' && !hasEmptyAfter) {
        updated.push({ value: '', status: 'idle' as const })
      }

      return updated
    })
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
  ) => {
    saveQuestion(index, e.target.value)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Save current question, passing value directly from the DOM
      saveQuestion(index, e.currentTarget.value)

      // Focus the next input after React re-renders
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 0)
    }
  }

  const renderRightSlot = (question: QuestionState, index: number) => {
    // Show spinner when saving
    if (question.status === 'saving') {
      return <Spinner className="size-4 text-[--foreground-faded]" />
    }

    // Show delete button on hover, otherwise show saved icon
    if (hoveredIndex === index && question.value.trim() !== '') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            deleteQuestion(index)
          }}
          className="hover:bg-[--error]/10 flex size-5 items-center justify-center rounded-sm text-[--error] transition-colors"
          aria-label="Delete question"
        >
          <Trash2 className="size-4" />
        </button>
      )
    }

    // Show green check when saved
    if (question.status === 'saved' && question.value.trim() !== '') {
      return <Check className="size-4 text-[--illinois-prairie]" />
    }

    return null
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {question.status === 'error' && question.errorMessage ? (
              <Tooltip open>
                <TooltipTrigger asChild>
                  <div>
                    <FormInput
                      as="input"
                      name={`question-${index}`}
                      placeholder="Add sample queries to illustrate usage of your AI."
                      className="w-full"
                      value={question.value}
                      status="error"
                      onChange={(e) => handleInputChange(e.target.value, index)}
                      onBlur={(e) => handleBlur(e, index)}
                      onKeyDown={(e) =>
                        handleKeyDown(
                          e as React.KeyboardEvent<HTMLInputElement>,
                          index,
                        )
                      }
                      ref={(el) => {
                        inputRefs.current[index] = el as HTMLInputElement
                      }}
                      rightSlot={renderRightSlot(question, index)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="border-[--error] bg-[--error] text-white"
                >
                  {question.errorMessage}
                </TooltipContent>
              </Tooltip>
            ) : (
              <FormInput
                as="input"
                name={`question-${index}`}
                placeholder="Add sample queries to illustrate usage of your AI."
                className="w-full"
                value={question.value}
                onChange={(e) => handleInputChange(e.target.value, index)}
                onBlur={(e) => handleBlur(e, index)}
                onKeyDown={(e) =>
                  handleKeyDown(
                    e as React.KeyboardEvent<HTMLInputElement>,
                    index,
                  )
                }
                ref={(el) => {
                  inputRefs.current[index] = el as HTMLInputElement
                }}
                rightSlot={renderRightSlot(question, index)}
              />
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
