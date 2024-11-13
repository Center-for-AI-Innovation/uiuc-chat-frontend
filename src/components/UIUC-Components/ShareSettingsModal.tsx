import { useState } from 'react'
import {
  Modal,
  Tabs,
  Text,
  Button,
  Group,
  TextInput,
  CopyButton,
  Tooltip,
  createStyles,
  Stack,
  Switch,
} from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import EmailChipsComponent from './EmailChipsComponent'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_paragraph } from 'fonts'

const useStyles = createStyles((theme) => ({
  modal: {
    '.mantine-Modal-content': {
      borderRadius: '24px',
      backgroundColor: '#15162c',
    },
    '.mantine-Modal-header': {
      backgroundColor: '#15162c',
      borderBottom: 'none',
      marginBottom: '-20px',
      padding: '24px 32px 0',
    },
    '.mantine-Modal-title': {
      color: 'white',
      fontSize: '24px',
      fontWeight: 600,
    },
    '.mantine-Modal-body': {
      marginTop: '-20px',
      padding: '24px 32px',
    },
  },
  tabs: {
    '.mantine-Tabs-tab': {
      marginTop: '40px',
      color: 'white',
      '&[data-active]': {
        color: theme.colors.violet[4],
        borderColor: theme.colors.violet[4],
      },
    },
  },
  shareInput: {
    input: {
      backgroundColor: '#1A1B1E',
      color: 'white',
      border: '1px solid #2C2E33',
      borderRadius: '8px',
      '&:focus': {
        borderColor: theme.colors.violet[4],
      },
    },
  },
  switch: {
    input: {
      '&:checked': {
        backgroundColor: theme.colors.violet[6],
        borderColor: theme.colors.violet[6],
      },
    },
  },
}))

interface ShareSettingsModalProps {
  opened: boolean
  onClose: () => void
  projectName: string
  metadata: CourseMetadata
}

export default function ShareSettingsModal({
  opened,
  onClose,
  projectName,
  metadata,
}: ShareSettingsModalProps) {
  const { classes } = useStyles()
  const [isPrivate, setIsPrivate] = useState(metadata?.is_private || false)
  const [courseAdmins, setCourseAdmins] = useState<string[]>([])
  const shareUrl = `${window.location.origin}/${projectName}`

  const handlePrivacyChange = async () => {
    const newIsPrivate = !isPrivate
    setIsPrivate(newIsPrivate)

    if (metadata) {
      metadata.is_private = newIsPrivate
      await callSetCourseMetadata(projectName, metadata)
    }
  }

  const handleEmailAddressesChange = async (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => {
    const response = await callSetCourseMetadata(
      course_name,
      new_course_metadata,
    )
    if (!response) {
      console.error('Error updating course metadata')
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Share Settings"
      size="lg"
      className={`${classes.modal} ${montserrat_paragraph.variable} font-montserratParagraph`}
    >
      <Tabs defaultValue="share" className={classes.tabs}>
        <Tabs.List>
          <Tabs.Tab value="share">Share Link</Tabs.Tab>
          <Tabs.Tab value="settings">Access Settings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="share" pt="xl">
          <Stack spacing="md">
            <Text size="sm" color="dimmed">
              Share your project with others using this link:
            </Text>
            <Group spacing="xs">
              <TextInput
                value={shareUrl}
                readOnly
                className={classes.shareInput}
                style={{ flex: 1 }}
              />
              <CopyButton value={shareUrl} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? 'Copied!' : 'Copy link'}
                    position="right"
                  >
                    <Button
                      color={copied ? 'teal' : 'violet'}
                      onClick={copy}
                      style={{ width: '100px' }}
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </Button>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="xl">
          <Stack spacing="xl">
            <Stack spacing="xs">
              <Group position="apart">
                <div>
                  <Text size="sm" weight={500} mb={4}>
                    Project Access
                  </Text>
                  <Text size="xs" color="dimmed">
                    Make your project private to restrict access
                  </Text>
                </div>
                <Switch
                  checked={isPrivate}
                  onChange={handlePrivacyChange}
                  className={classes.switch}
                  size="md"
                />
              </Group>
            </Stack>

            {isPrivate && (
              <Stack spacing="md">
                <Text size="sm" weight={500} mb={8}>
                  People with access
                </Text>
                <EmailChipsComponent
                  course_owner={metadata.course_owner as string}
                  course_admins={courseAdmins}
                  course_name={projectName}
                  is_private={isPrivate}
                  onEmailAddressesChange={handleEmailAddressesChange}
                  course_intro_message={metadata.course_intro_message || ''}
                  banner_image_s3={metadata.banner_image_s3 || ''}
                  openai_api_key={metadata.openai_api_key as string}
                  is_for_admins={false}
                />
              </Stack>
            )}
            <Stack spacing="md">
              <Text size="sm" weight={500} mb={8}>
                Administrators
              </Text>
              <EmailChipsComponent
                course_owner={metadata.course_owner as string}
                course_admins={courseAdmins}
                course_name={projectName}
                is_private={isPrivate}
                onEmailAddressesChange={handleEmailAddressesChange}
                course_intro_message={metadata.course_intro_message || ''}
                banner_image_s3={metadata.banner_image_s3 || ''}
                openai_api_key={metadata.openai_api_key as string}
                is_for_admins={true}
              />
            </Stack>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
