import { useState, useEffect } from 'react'
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Checkbox,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import { Montserrat } from 'next/font/google'
import type { SimWorkflowInputField, WorkflowMetadata } from '~/types/sim'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

interface WorkflowMetadataEditorProps {
  course_name: string
  workflowIds: string[]
  onSave: () => void
}

const notificationStyles = (isError = false) => {
  return {
    root: {
      backgroundColor: 'var(--notification)',
      borderColor: isError ? '#E53935' : 'var(--notification-border)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '8px',
    },
    title: {
      color: 'var(--notification-title)',
      fontWeight: 600,
    },
    description: {
      color: 'var(--notification-message)',
    },
    closeButton: {
      color: 'var(--notification-title)',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    icon: {
      backgroundColor: 'transparent',
      color: isError ? '#E53935' : 'var(--notification-title)',
    },
  }
}

export const WorkflowMetadataEditor = ({
  course_name,
  workflowIds,
  onSave,
}: WorkflowMetadataEditorProps) => {
  const [metadata, setMetadata] = useState<Record<string, WorkflowMetadata>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing metadata
  const loadMetadata = async () => {
    setIsLoading(true)
    try {
      const stored = localStorage.getItem(`sim_workflow_metadata_${course_name}`)
      if (stored) {
        setMetadata(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading metadata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load metadata on mount
  useEffect(() => {
    loadMetadata()
  }, [course_name])

  const handleUpdateMetadata = (
    workflowId: string,
    field: 'name' | 'description',
    value: string
  ) => {
    setMetadata((prev) => ({
      ...prev,
      [workflowId]: {
        ...(prev[workflowId] || { name: '', description: '', inputFields: [] }),
        [field]: value,
      },
    }))
  }

  const handleAddInputField = (workflowId: string) => {
    setMetadata((prev) => {
      const current = prev[workflowId] || { name: '', description: '', inputFields: [] }
      return {
        ...prev,
        [workflowId]: {
          ...current,
          inputFields: [
            ...(current.inputFields || []),
            { name: '', type: 'string', description: '', required: false },
          ],
        },
      }
    })
  }

  const handleUpdateInputField = (
    workflowId: string,
    fieldIndex: number,
    key: keyof SimWorkflowInputField,
    value: any
  ) => {
    setMetadata((prev) => {
      const current = prev[workflowId] || { name: '', description: '', inputFields: [] }
      const updatedFields = [...(current.inputFields || [])]
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        [key]: value,
      } as SimWorkflowInputField
      return {
        ...prev,
        [workflowId]: {
          ...current,
          inputFields: updatedFields,
        },
      }
    })
  }

  const handleRemoveInputField = (workflowId: string, fieldIndex: number) => {
    setMetadata((prev) => {
      const current = prev[workflowId] || { name: '', description: '', inputFields: [] }
      const updatedFields = [...(current.inputFields || [])]
      updatedFields.splice(fieldIndex, 1)
      return {
        ...prev,
        [workflowId]: {
          ...current,
          inputFields: updatedFields,
        },
      }
    })
  }

  const handleSaveMetadata = () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem(
        `sim_workflow_metadata_${course_name}`,
        JSON.stringify(metadata)
      )

      notifications.show({
        title: 'Success',
        message: 'Workflow metadata saved successfully!',
        color: 'green',
        icon: <IconCheck />,
        styles: notificationStyles(false),
      })
      onSave()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save workflow metadata. Please try again.',
        color: 'red',
        icon: <IconAlertCircle />,
        styles: notificationStyles(true),
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (workflowIds.length === 0) {
    return (
      <Card
        withBorder
        padding="lg"
        radius="md"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--dashboard-border)',
        }}
      >
        <Text
          className={`${montserrat_med.className}`}
          style={{ color: 'var(--foreground)' }}
        >
          Add workflow IDs above to configure metadata.
        </Text>
      </Card>
    )
  }

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--dashboard-border)',
      }}
    >
      <Stack spacing="md">
        <Group position="apart">
          <Title
            order={4}
            className={`${montserrat_med.className}`}
            style={{ color: 'var(--foreground)' }}
          >
            Workflow Metadata
          </Title>
          <Button
            onClick={handleSaveMetadata}
            loading={isSaving}
            className="rounded-lg bg-[--dashboard-button] hover:bg-[--dashboard-button-hover]"
            leftIcon={<IconCheck size={16} />}
          >
            Save All
          </Button>
        </Group>

        <Text
          size="sm"
          className={`${montserrat_med.className}`}
          style={{ color: 'var(--muted-foreground)' }}
        >
          Add names and descriptions for your workflows to make them easier to identify.
        </Text>

        {workflowIds.map((workflowId) => (
          <Card
            key={workflowId}
            padding="md"
            radius="sm"
            style={{
              backgroundColor: 'var(--background-faded)',
              borderColor: 'var(--input-border)',
            }}
            withBorder
          >
            <Stack spacing="xs">
              <Text
                size="xs"
                className={`${montserrat_med.className} font-mono`}
                style={{ color: 'var(--muted-foreground)' }}
              >
                ID: {workflowId}
              </Text>

              <TextInput
                label="Workflow Name"
                placeholder="e.g., Weather Analysis"
                value={metadata[workflowId]?.name || ''}
                onChange={(e) =>
                  handleUpdateMetadata(workflowId, 'name', e.target.value)
                }
                className={`${montserrat_med.className}`}
                styles={{
                  input: {
                    backgroundColor: 'var(--input-background)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--foreground)',
                  },
                  label: {
                    color: 'var(--foreground)',
                    marginBottom: '4px',
                  },
                }}
              />

              <Textarea
                label="Description"
                placeholder="e.g., Analyzes weather data and provides insights"
                value={metadata[workflowId]?.description || ''}
                onChange={(e) =>
                  handleUpdateMetadata(workflowId, 'description', e.target.value)
                }
                className={`${montserrat_med.className}`}
                minRows={2}
                styles={{
                  input: {
                    backgroundColor: 'var(--input-background)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--foreground)',
                  },
                  label: {
                    color: 'var(--foreground)',
                    marginBottom: '4px',
                  },
                }}
              />

              <div style={{ marginTop: '1rem' }}>
                <Group position="apart" mb="xs">
                  <Text
                    size="sm"
                    weight={500}
                    style={{ color: 'var(--foreground)' }}
                  >
                    Input Parameters
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftIcon={<IconPlus size={14} />}
                    onClick={() => handleAddInputField(workflowId)}
                    className="bg-[--dashboard-button] hover:bg-[--dashboard-button-hover]"
                  >
                    Add Parameter
                  </Button>
                </Group>

                {metadata[workflowId]?.inputFields?.map((field, idx) => (
                  <Card
                    key={idx}
                    padding="sm"
                    mb="xs"
                    style={{
                      backgroundColor: 'var(--input-background)',
                      borderColor: 'var(--input-border)',
                    }}
                    withBorder
                  >
                    <Stack spacing="xs">
                      <Group position="apart">
                        <Text size="xs" color="dimmed">
                          Parameter {idx + 1}
                        </Text>
                        <ActionIcon
                          color="red"
                          size="sm"
                          onClick={() => handleRemoveInputField(workflowId, idx)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>

                      <TextInput
                        placeholder="Parameter name (e.g., query, input)"
                        value={field.name}
                        onChange={(e) =>
                          handleUpdateInputField(
                            workflowId,
                            idx,
                            'name',
                            e.target.value
                          )
                        }
                        size="xs"
                        styles={{
                          input: {
                            backgroundColor: 'var(--background)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--foreground)',
                          },
                        }}
                      />

                      <Select
                        placeholder="Type"
                        value={field.type}
                        onChange={(value) =>
                          handleUpdateInputField(
                            workflowId,
                            idx,
                            'type',
                            value
                          )
                        }
                        data={[
                          { value: 'string', label: 'String' },
                          { value: 'number', label: 'Number' },
                          { value: 'boolean', label: 'Boolean' },
                          { value: 'object', label: 'Object' },
                          { value: 'array', label: 'Array' },
                          { value: 'files', label: 'Files' },
                        ]}
                        size="xs"
                        styles={{
                          input: {
                            backgroundColor: 'var(--background)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--foreground)',
                          },
                        }}
                      />

                      <TextInput
                        placeholder="Description"
                        value={field.description || ''}
                        onChange={(e) =>
                          handleUpdateInputField(
                            workflowId,
                            idx,
                            'description',
                            e.target.value
                          )
                        }
                        size="xs"
                        styles={{
                          input: {
                            backgroundColor: 'var(--background)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--foreground)',
                          },
                        }}
                      />

                      <Checkbox
                        label="Required"
                        checked={field.required || false}
                        onChange={(e) =>
                          handleUpdateInputField(
                            workflowId,
                            idx,
                            'required',
                            e.currentTarget.checked
                          )
                        }
                        size="xs"
                        styles={{
                          label: { color: 'var(--foreground)' },
                        }}
                      />
                    </Stack>
                  </Card>
                ))}

                {(!metadata[workflowId]?.inputFields ||
                  metadata[workflowId]?.inputFields?.length === 0) && (
                  <Text
                    size="xs"
                    color="dimmed"
                    style={{ fontStyle: 'italic' }}
                  >
                    No input parameters defined. Click "Add Parameter" to add one.
                  </Text>
                )}
              </div>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  )
}
