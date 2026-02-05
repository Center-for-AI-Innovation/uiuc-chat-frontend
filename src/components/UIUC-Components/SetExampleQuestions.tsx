import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'

import { FormInput } from '@/components/shadcn/ui/form-input'
import { Button } from '@/components/shadcn/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip'
import { Spinner } from '@/components/shadcn/ui/spinner'

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
  const example_questions = course_metadata?.example_questions || []
  const [questions, setQuestions] = useState<QuestionState[]>(() => {
    const initialQuestions =
      example_questions.length > 0 ? example_questions : []
    return initialQuestions.map((q) => ({
      value: q,
      status: 'saved' as const,
    }))
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Track original values to detect changes
  const originalValuesRef = useRef<string[]>(
    example_questions.length > 0 ? [...example_questions] : [],
  )

  // Register step leave callback
  useEffect(() => {
    const saveAllQuestions = async (): Promise<boolean> => {
      const validQuestions = questions
        .map((q) => q.value.trim())
        .filter((q) => q !== '')

      try {
        const success = await callSetCourseMetadata(course_name, {
          ...course_metadata,
          example_questions: validQuestions,
        })

        if (success) {
          originalValuesRef.current = validQuestions
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
      const questionsToSave = questions.filter(
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
  }, [onStepLeave, questions, course_name, course_metadata])

  const saveQuestion = useCallback(
    async (index: number) => {
      const question = questions[index]
      if (!question) return

      const trimmedValue = question.value.trim()

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

      // Get all valid questions for the save
      const allQuestions = questions
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
    [questions, course_name, course_metadata],
  )

  const deleteQuestion = async (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index)
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
        setQuestions(newQuestions)
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
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, value, status: 'idle', errorMessage: undefined }
          : q,
      ),
    )
  }

  const handleBlur = (index: number) => {
    saveQuestion(index)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Save current question
      saveQuestion(index)

      // Navigate to next question or create new one
      if (index === questions.length - 1) {
        // Last question - create new one
        addNewQuestion()
        // Focus will be set in useEffect after render
        setTimeout(() => {
          inputRefs.current[questions.length]?.focus()
        }, 0)
      } else {
        // Move to next question
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const addNewQuestion = () => {
    setQuestions((prev) => [...prev, { value: '', status: 'idle' }])
    // Focus the new input after render
    setTimeout(() => {
      inputRefs.current[questions.length]?.focus()
    }, 0)
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
                      onBlur={() => handleBlur(index)}
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
                onBlur={() => handleBlur(index)}
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

        <Button
          type="button"
          variant="dashboard"
          size="sm"
          onClick={addNewQuestion}
          className="w-fit"
        >
          <Plus className="size-4" />
          Add new question
        </Button>
      </div>
    </TooltipProvider>
  )
}
