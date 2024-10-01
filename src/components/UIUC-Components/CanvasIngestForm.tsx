import React, { useEffect, useState } from 'react'
import { Text, Switch, Card, Skeleton, Tooltip, Checkbox, useMantineTheme, Button, Input } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
// const theme = useMantineTheme()

const checkboxStyle = {
  borderColor: 'gray',
}

export default function CanvasIngestForm() {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [selectedCanvasOptions, setSelectedCanvasOptions] = useState<string[]>([
    'files',
    'pages',
    'modules',
    'syllabus',
    'assignments',
    'discussions',
  ])
  const [url, setUrl] = useState('')
  const [showContentOptions, setShowContentOptions] = useState(false);
  const handleCanvasOptionChange = (value: string) => {
    if (selectedCanvasOptions.includes(value)) {
      setSelectedCanvasOptions((prev) => prev.filter((item) => item !== value))
    } else {
      setSelectedCanvasOptions((prev) => [...prev, value])
    }
  }
  const validateUrl = (url: string) => {
    const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
    const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/.+/
    const canvasRegex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
    const webScrapingRegex = /^(https?:\/\/)?.+/

    return (
      courseraRegex.test(url) ||
      mitRegex.test(url) ||
      githubRegex.test(url) ||
      canvasRegex.test(url) ||
      webScrapingRegex.test(url)
    )
  }
  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])
  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }
  return (
    <motion.div layout>
      <Card
        shadow="sm"
        p="lg"
        radius="lg"
        className="max-w-[330px] bg-[#15162c] md:w-[330px]"
        onClick={() => setShowContentOptions(!showContentOptions)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text
                size="lg"
                weight={500}
                mb="xs"
                style={{ paddingRight: '8px' }}
              >
                Canvas
              </Text>
            </div>
          </div>
          {/* <form.Field name={`providers.${ProviderNames.Anthropic}.enabled`}>
          {(field: any) => (
            <Switch
              size="md"
              labelPosition="left"
              onLabel="ON"
              offLabel="OFF"
              aria-label="Enable Anthropic provider"
              checked={field.state.value}
              onChange={(event) => {
                event.preventDefault()
                field.handleChange(event.currentTarget.checked)
                form.handleSubmit()
              }}
              thumbIcon={
                field.state.value ? (
                  <IconCheck size="0.8rem" color="purple" stroke={3} />
                ) : (
                  <IconX size="0.8rem" color="grey" stroke={3} />
                )
              }
              styles={{
                track: {
                  backgroundColor: field.state.value
                    ? '#6a29a4 !important'
                    : '#25262b',
                  borderColor: field.state.value
                    ? '#6a29a4 !important'
                    : '#25262b',
                },
              }}
            />
          )}
        </form.Field> */}
        </div>
        <Input
          // icon={icon}
          // I can't figure out how to change the background colors.
          className={`mt-4 w-[30%] min-w-[18rem] disabled:bg-purple-200 lg:w-[75%]`}
          // wrapperProps={{ borderRadius: 'xl' }}
          // styles={{ input: { backgroundColor: '#1A1B1E' } }}
          styles={{
            input: {
              backgroundColor: '#1A1B1E',
              paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            },
          }}
          placeholder="Enter URL..."
          radius={'xl'}
          type="url" // Set the type to 'url' to avoid thinking it's a username or pw.
          value={url}
          size={'lg'}
          // disabled={isDisabled}
          onChange={(e) => {
            setUrl(e.target.value)
            setShowContentOptions(
              e.target.value.includes('canvas.illinois.edu'),
            )
          }}
          //   onKeyPress={(event) => {
          //   if (event.key === 'Enter') {
          //     handleSubmit()
          //   }
          // }}
          rightSection={
            <Button
              // onClick={(e) => {
              //   e.preventDefault()
              //   if (validateInputs() && validateUrl(url)) {
              //     handleSubmit()
              //   }
              // }}
              size="md"
              radius={'xl'}
              className={`rounded-s-md ${isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'
                } overflow-ellipsis text-ellipsis p-2 ${isUrlUpdated ? 'text-white' : 'text-gray-500'
                } min-w-[5rem] -translate-x-1 transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
              // w={`${isSmallScreen ? 'auto' : 'auto'}`}
              w={'auto'}
            // disabled={isDisabled}
            >
              Ingest
            </Button>
          }
          // rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
          rightSectionWidth={'auto'}
        />
        {/* {provider?.error &&
          (form.state.values?.providers?.Anthropic?.enabled ||
            provider.enabled) && (
            <Text
              size="sm"
              color="red"
              mb="md"
              style={{
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
              }}
            >
              {provider.error}
            </Text>
          )} */}
        {/* <form.Field name={`providers.${ProviderNames.Anthropic}.enabled`}>
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form.Field
                    name={`providers.${ProviderNames.Anthropic}.apiKey`}
                  >
                    {(field: any) => (
                      <APIKeyInput
                        field={field}
                        placeholder="Anthropic API Key"
                      />
                    )}
                  </form.Field>
                  <ModelToggles form={form} provider={provider} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field> */}
        {showContentOptions && (
          <form
            className="mt-3 w-[70%] min-w-[20rem] lg:w-[70%]"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <div>
              <div className="mb-2 flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest all files from the Canvas course."
                >
                  <Checkbox
                    value="files"
                    label="Files"
                    size="md"
                    // style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('files')}
                    onChange={() => handleCanvasOptionChange('files')}
                  />
                </Tooltip>
              </div>
              <div className="mb-2 flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest all pages from the Canvas course."
                >
                  <Checkbox
                    value="pages"
                    label="Pages"
                    size="md"
                    style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('pages')}
                    onChange={() => handleCanvasOptionChange('pages')}
                  />
                </Tooltip>
              </div>
              <div className="mb-2 flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest all modules from the Canvas course."
                >
                  <Checkbox
                    value="modules"
                    label="Modules"
                    size="md"
                    style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('modules')}
                    onChange={() => handleCanvasOptionChange('modules')}
                  />
                </Tooltip>
              </div>
              <div className="mb-2 flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest the course syllabus from Canvas."
                >
                  <Checkbox
                    value="syllabus"
                    label="Syllabus"
                    size="md"
                    style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('syllabus')}
                    onChange={() => handleCanvasOptionChange('syllabus')}
                  />
                </Tooltip>
              </div>
              <div className="mb-2 flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest all assignments from the Canvas course."
                >
                  <Checkbox
                    value="assignments"
                    label="Assignments"
                    size="md"
                    style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('assignments')}
                    onChange={() => handleCanvasOptionChange('assignments')}
                  />
                </Tooltip>
              </div>
              <div className="flex items-center">
                <Tooltip
                  multiline
                  color="#15162b"
                  arrowPosition="side"
                  position="bottom-start"
                  arrowSize={8}
                  withArrow
                  label="Select this option to ingest all discussions from the Canvas course."
                >
                  <Checkbox
                    value="discussions"
                    label="Discussions"
                    size="md"
                    style={checkboxStyle}
                    checked={selectedCanvasOptions.includes('discussions')}
                    onChange={() => handleCanvasOptionChange('discussions')}
                  />
                </Tooltip>
              </div>
            </div>
            <Text className="mt-4 text-lg font-bold text-red-600 underline">
              Please ensure that you have added the UIUC Chatbot as a student
              to your course on Canvas before you begin ingesting the course
              content. The bot email address is uiuc.chat@ad.uillinois.edu and
              the bot name is UIUC Course AI.
            </Text>
          </form>
        )}
      </Card>
      {/* Canvas ingest form */}

    </motion.div>
  )
}
