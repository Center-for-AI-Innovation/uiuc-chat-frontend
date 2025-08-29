import { TextInput, Button, Group, Box } from '@mantine/core'
import { useState, useEffect } from 'react'
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
    <Box className="pl-1 pr-1">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          upsertCourseMetadata(inputList.filter((item) => item !== ''))
        }}
      >
        {inputList.map((value, i) => {
          return (
            <div className="flex items-center gap-2">
              <TextInput
                key={i}
                // withAsterisk
                name="question"
                placeholder="Add sample queries to illustrate usage of your AI."
                className="w-full"
                styles={{
                  input: {
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--dashboard-border)',
                    padding: 'calc(var(--padding) * .75)',
                    paddingRight: '6rem', //make room for button
                    marginTop: '.25rem',

                    '&:focus': {
                      borderColor: 'var(--background-darker)',
                    },
                  },
                }}
                value={value}
                onChange={(e) => handleInputChange(e, i)}
                onFocus={() => handleInputFocus(i)}
                // onBlur={() => handleInputBlur(i)} I couldn't get this working to remove boxes...
              />

              <Button
                type="submit"
                size={'xs'}
                disabled={value == ''}
                className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] disabled:bg-[--background-faded] disabled:text-[--foreground-fadaed] disabled:opacity-50"
                onClick={async () => {}}
              >
                Save
              </Button>
            </div>
          )
        })}
        {/*
        <Group position="right" mt="md">
          <Button
            className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
            type="submit"
          >
            Add
          </Button>
        </Group>
*/}
      </form>
    </Box>
  )
}
