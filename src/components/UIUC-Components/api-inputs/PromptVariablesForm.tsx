import React, { useState, useEffect } from 'react'
import {
  Text,
  Button,
  TextInput,
  Flex,
  Group,
  Modal,
  ActionIcon,
  Tooltip,
  Box,
  Paper,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconAlertTriangle,
  IconTrash,
  IconPlus,
  IconInfoCircle,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

interface VariablePair {
  id: string
  key: string
  value: string
}

interface PromptVariablesFormProps {
  systemPrompt: string
  onUpdateSystemPrompt: (newPrompt: string) => Promise<void>
  isModalOpen: boolean
  closeModal: () => void
}

const VARIABLES_START_TAG = '### Start User Defined Variables ###'
const VARIABLES_END_TAG = '### End User Defined Variables ###'

export const PromptVariablesForm: React.FC<PromptVariablesFormProps> = ({
  systemPrompt,
  onUpdateSystemPrompt,
  isModalOpen,
  closeModal,
}) => {
  const [variables, setVariables] = useState<VariablePair[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract existing variables from the prompt when the component mounts or prompt changes
  useEffect(() => {
    if (systemPrompt) {
      const extractedVariables = extractVariablesFromPrompt(systemPrompt)
      setVariables(extractedVariables)
    }
  }, [systemPrompt, isModalOpen])

  const extractVariablesFromPrompt = (prompt: string): VariablePair[] => {
    const startIdx = prompt.indexOf(VARIABLES_START_TAG)
    const endIdx = prompt.indexOf(VARIABLES_END_TAG)

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
      return []
    }

    const variablesSection = prompt.slice(
      startIdx + VARIABLES_START_TAG.length,
      endIdx,
    )
    
    return variablesSection
      .split('\n')
      .filter((line) => line.trim() && line.includes(':'))
      .map((line) => {
        const [key, value] = line.split(':').map((part) => part.trim())
        return {
          id: Math.random().toString(36).substr(2, 9),
          key,
          value,
        }
      })
  }

  const handleKeyChange = (id: string, newKey: string) => {
    setVariables((prev) =>
      prev.map((variable) =>
        variable.id === id ? { ...variable, key: newKey } : variable,
      ),
    )
  }

  const handleValueChange = (id: string, newValue: string) => {
    setVariables((prev) =>
      prev.map((variable) =>
        variable.id === id ? { ...variable, value: newValue } : variable,
      ),
    )
  }

  const handleAddVariable = () => {
    setVariables((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        key: '',
        value: '',
      },
    ])
  }

  const handleRemoveVariable = (id: string) => {
    setVariables((prev) => prev.filter((variable) => variable.id !== id))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Construct the variables section
      const variablesSection = `${VARIABLES_START_TAG}\n${variables
        .map((variable) => `${variable.key}: ${variable.value}`)
        .join('\n')}\n${VARIABLES_END_TAG}`

      let newPrompt = systemPrompt

      // Check if variables section already exists
      const startIdx = systemPrompt.indexOf(VARIABLES_START_TAG)
      const endIdx = systemPrompt.indexOf(VARIABLES_END_TAG)

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        // Replace existing variables section
        newPrompt =
          systemPrompt.slice(0, startIdx) +
          variablesSection +
          systemPrompt.slice(endIdx + VARIABLES_END_TAG.length)
      } else {
        // Add variables section at the end of the prompt
        newPrompt = `${systemPrompt}\n\n${variablesSection}`
      }

      setIsSubmitting(false)
      await onUpdateSystemPrompt(newPrompt)
      showNotification('Variables Updated', 'The variables have been successfully updated in the prompt.', false)
      closeModal()
    } catch (error) {
      console.error('Error updating variables:', error)
      showNotification('Error', 'Failed to update variables. Please try again.', true)
    }
  }

  const showNotification = (title: string, message: string, isError: boolean = false) => {
    notifications.show({
      title,
      message,
      color: isError ? 'red' : 'green',
      icon: isError ? <IconAlertTriangle size={18} /> : <IconCheck size={18} />,
      styles: (theme) => ({
        root: {
          backgroundColor: '#1A1B1E',
          borderColor: isError ? '#E53935' : '#6D28D9',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '8px',
        },
        title: {
          color: '#FFFFFF',
          fontWeight: 600,
        },
        description: {
          color: '#D1D1D1',
        },
        closeButton: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      }),
    })
  }

  return (
    <Modal
      opened={isModalOpen}
      onClose={closeModal}
      title={
        <Text
          className={`${montserrat_heading.variable} font-montserratHeading`}
          size="lg"
          weight={700}
          gradient={{ from: 'gold', to: 'white', deg: 45 }}
          variant="gradient"
        >
          User Defined Variables
        </Text>
      }
      centered
      size="lg"
      styles={{
        header: {
          backgroundColor: '#15162c',
          borderBottom: '1px solid #2D2F48',
          padding: '20px 24px',
        },
        content: {
          backgroundColor: '#15162c',
          border: '1px solid #2D2F48',
        },
        body: {
          padding: '24px',
        },
        title: {
          marginBottom: '0',
        },
        close: {
          color: '#D1D1D1',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <Paper p="md" mb="md" style={{ backgroundColor: '#1a1b34', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
        <Flex align="center" mb="xs">
          <IconInfoCircle size={18} style={{ color: 'hsl(280,100%,70%)' }} />
          <Text ml="xs" className={`${montserrat_paragraph.variable} font-montserratParagraph`}>
            Define variables that will be injected into your prompt. These can be used to dynamically customize your bot's behavior.
          </Text>
        </Flex>
        <Text size="sm" className={`${montserrat_paragraph.variable} font-montserratParagraph`} color="gray.4">
          Variables will be added in a special section at the end of your prompt in the format: KEY: VALUE
        </Text>
      </Paper>

      <Box mb="md">
        {variables.map((variable) => (
          <Flex key={variable.id} mb="xs" align="center">
            <TextInput
              placeholder="Variable Name"
              value={variable.key}
              onChange={(e) => handleKeyChange(variable.id, e.target.value)}
              required
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              styles={{
                input: {
                  backgroundColor: '#1d1f33',
                  color: 'white',
                  border: '1px solid #2D2F48',
                },
              }}
              style={{ flex: 1, marginRight: '8px' }}
            />
            <Text mx="xs">:</Text>
            <TextInput
              placeholder="Value"
              value={variable.value}
              onChange={(e) => handleValueChange(variable.id, e.target.value)}
              required
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              styles={{
                input: {
                  backgroundColor: '#1d1f33',
                  color: 'white',
                  border: '1px solid #2D2F48',
                },
              }}
              style={{ flex: 1 }}
            />
            <Tooltip label="Remove Variable" position="right">
              <ActionIcon
                ml="sm"
                color="red"
                variant="subtle"
                onClick={() => handleRemoveVariable(variable.id)}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        ))}

        <Button
          mt="md"
          variant="subtle"
          leftIcon={<IconPlus size={18} />}
          onClick={handleAddVariable}
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          color="blue"
        >
          Add Variable
        </Button>
      </Box>

      <Group position="right" mt="xl">
        <Button
          variant="outline"
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          onClick={closeModal}
          styles={(theme) => ({
            root: {
              borderColor: theme.colors.gray[6],
              color: '#fff',
              '&:hover': {
                backgroundColor: theme.colors.gray[8],
              },
            },
          })}
        >
          Cancel
        </Button>
        <Button
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          onClick={handleSubmit}
          loading={isSubmitting}
          sx={(theme) => ({
            background: 'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%) !important',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(90deg, #4f46e5 0%, #2563eb 50%, #6d28d9 100%) !important',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
          })}
        >
          Update Variables
        </Button>
      </Group>
    </Modal>
  )
}

export default PromptVariablesForm 