import { TextInput, Button, Group, Box } from '@mantine/core'
import { useState, useEffect } from 'react'
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { useTranslation } from 'next-i18next'

export default function SetExampleQuestions({
  course_name,
  course_metadata,
}: {
  course_name: string
  course_metadata: CourseMetadataOptionalForUpsert
}) {
  const { t } = useTranslation('common')
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
      alert(t('example_questions.course_name_required'))
      return
    }

    const new_course_metadata = {
      example_questions: example_questions,
    } as CourseMetadataOptionalForUpsert

    await callSetCourseMetadata(course_name, new_course_metadata)
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
            <TextInput
              key={i}
              label={t('example_questions.example_question_label')}
              name="question"
              placeholder={t('example_questions.example_question_placeholder') as unknown as string}
              styles={{
                label: {
                  color: 'var(--foreground-faded)',
                },
                input: {
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--background)',
                },
              }}
              value={value}
              onChange={(e) => handleInputChange(e, i)}
              onFocus={() => handleInputFocus(i)}
            />
          )
        })}
        <Group position="right" mt="md">
          <Button
            className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
            type="submit"
          >
            {t('example_questions.submit_button')}
          </Button>
        </Group>
      </form>
    </Box>
  )
}
