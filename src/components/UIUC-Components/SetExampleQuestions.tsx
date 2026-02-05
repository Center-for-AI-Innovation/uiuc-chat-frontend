import { Button, Group } from '@mantine/core'
import { useState, useEffect } from 'react'

import { FormInput } from '@/components/shadcn/ui/form-input'

import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'

export default function SetExampleQuestions({
  course_name,
  course_metadata,
}: {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert
}) {
  const example_questions = course_metadata?.example_questions || ['']
  const [inputList, setInputList] = useState(
    example_questions.length > 0 ? example_questions : [''],
  )
  const [isTyping, setIsTyping] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value
    const list = [...inputList]
    list[index] = value
    setInputList(list)
    if (index === inputList.length - 1 && value !== '') {
      setIsTyping(true)
    }
  }

  const handleInputFocus = (index: number) => {
    if (inputList.every((item) => item !== '')) {
      setIsTyping(true)
    }
  }

  useEffect(() => {
    if (isTyping) {
      handleAddClick()
      setIsTyping(false)
    }
  }, [isTyping])

  const handleAddClick = () => {
    if (inputList[inputList.length - 1] !== '') {
      setInputList([...inputList, ''])
    }
  }

  const upsertCourseMetadata = async (example_questions: string[]) => {
    if (!course_name || course_name.toString().trim() === '') {
      alert('Course name is required')
      return
    }

    const new_course_metadata = {
      example_questions: example_questions,
    } as CourseMetadataOptionalForUpsert

    await callSetCourseMetadata(course_name, new_course_metadata)
    // console.log("FINISHED SETTING THE EXAMPLE QUESTIONS")
  }

  return (
    <div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          upsertCourseMetadata(inputList.filter((item) => item !== ''))
        }}
      >
        {inputList.map((value, i) => {
          return (
            <div className="flex flex-col gap-2" key={i}>
              <FormInput
                as="input"
                name="question"
                placeholder="Add sample queries to illustrate usage of your AI."
                className="w-full"
                value={value}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLInputElement>, i)
                }
                onFocus={() => handleInputFocus(i)}
              />

              <div>
                <Button
                  type="submit"
                  size={'xs'}
                  disabled={value === ''}
                  className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] disabled:bg-[--background-faded] disabled:text-[--foreground-faded] disabled:opacity-50"
                  onClick={async () => {}}
                >
                  Save
                </Button>
              </div>
            </div>
          )
        })}
      </form>
    </div>
  )
}
