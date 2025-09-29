import React, { useState } from 'react'
import {
  Modal,
  Button,
  Textarea,
  Select,
  createStyles,
  useMantineTheme,
  Text,
  Group,
  type MantineTheme,
} from '@mantine/core'
import { useTranslation } from 'next-i18next'

const useStyles = createStyles((theme: MantineTheme) => ({
  root: {
    backgroundColor: 'var(--modal)',
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
  },
  title: {
    color: 'var(--modal-text)',
    fontSize: theme.fontSizes.xl,
    fontWeight: 700,
    marginBottom: 0,
  },
  close: {
    color: 'var(--modal-text)',
    '&:hover': {
      color: 'var(--modal-button-text-hover)',
      backgroundColor: 'var(--modal-button-hover)',
    },
  },
  textarea: {
    color: 'var(--modal-text)',
    backgroundColor: 'var(--background-faded)',
    borderColor: 'var(--modal-border)',
    '&::placeholder': {
      color: 'var(--foreground-faded)',
    },
    '&:focus': {
      borderColor: 'var(--background-darker)',
    },
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  label: {
    color: 'var(--modal-text)',
    marginBottom: theme.spacing.xs,
  },
}))

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: string, category: string) => void
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { classes } = useStyles()
  const theme = useMantineTheme()
  const { t } = useTranslation('common')
  const [feedback, setFeedback] = useState<string>('')
  const [category, setCategory] = useState<string>('other')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(feedback, category)
      setFeedback('')
      setCategory('other')
      onClose()
    } catch (error) {
      console.error('Feedback submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text className={classes.title}>{t('feedback.title')}</Text>}
      classNames={classes}
      centered
      withCloseButton={false}
      overlayProps={{
        color: 'theme.colors.dark[9]',
        opacity: 0.75,
        blur: 3,
      }}
      styles={{
        header: {
          zIndex: 1,
          color: 'var(--modal-text)',
          backgroundColor: 'var(--modal)',
        },
        body: {
          color: 'var(--modal-text)',
          backgroundColor: 'var(--modal)',
        },
      }}
    >
      <Select
        label={t('feedback.category')}
        placeholder={t('feedback.category_placeholder') as unknown as string}
        data={[
          { value: 'inaccurate', label: t('feedback.types.inaccurate') as unknown as string },
          { value: 'inappropriate', label: t('feedback.types.inappropriate') as unknown as string },
          { value: 'unclear', label: t('feedback.types.unclear') as unknown as string },
          { value: 'ui_bug', label: t('feedback.types.ui_bug') as unknown as string },
          { value: 'overactive_refusal', label: t('feedback.types.overactive_refusal') as unknown as string },
          {
            value: 'incomplete_request',
            label: t('feedback.types.incomplete_request') as unknown as string,
          },
          { value: 'other', label: t('feedback.types.other') as unknown as string },
        ]}
        value={category}
        onChange={(value) => setCategory(value || 'other')}
        mt={0}
        mb="xl"
        withinPortal
        styles={(theme) => ({
          input: {
            color: 'var(--modal-text)',
            backgroundColor: 'var(--modal-dark)',
            borderColor: 'var(--modal-border)',
            '&::placeholder': {
              color: 'var(--foreground-faded)',
            },
            '&:focus': {
              borderColor: 'var(--background-darker)',
            },
          },
          dropdown: {
            backgroundColor: 'var(--modal-dark)',
            borderColor: 'var(--modal-border)',
            maxHeight: '250px',
            overflowY: 'auto',
          },
          item: {
            color: 'var(--modal-text)',
            '&[data-selected]': {
              color: 'var(--dashboard-button-foreground)',
              backgroundColor: 'var(--dashboard-button)',
              '&[data-hovered]': {
                color: 'var(--dashboard-button-foreground)',
                backgroundColor: 'var(--dashboard-button-hover)',
              },
            },
            '&[data-hovered]': {
              color: 'var(--foreground)',
              backgroundColor: 'var(--background-dark)',
            },
          },
          label: {
            color: 'var(--modal-text)',
            marginBottom: theme.spacing.xs,
          },
        })}
        aria-label={t('feedback.category') as unknown as string}
      />
      <Textarea
        label={
          <Group spacing={4}>
            <Text className="text-[--modal-text]">{t('feedback.details')}</Text>
            <Text size="sm" className="text-[--foreground-faded]">
              {t('common.optional')}
            </Text>
          </Group>
        }
        placeholder={t('feedback.details_placeholder') as unknown as string}
        value={feedback}
        onChange={(event) => setFeedback(event.currentTarget.value)}
        minRows={4}
        mb="md"
        classNames={{ input: classes.textarea }}
        aria-label={t('feedback.details') as unknown as string}
      />

      <Group className={classes.buttonGroup}>
        <Button
          onClick={onClose}
          variant="outline"
          aria-label={t('common.cancel')}
          sx={{
            backgroundColor: 'transparent',
            color: 'var(--foreground-faded)',
            border: `1px solid var(--background-faded)`,
            '&:hover': {
              color: 'var(--foreground)',
              backgroundColor: 'var(--background-faded)',
            },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          aria-label={t('feedback.submit') as unknown as string}
          sx={{
            backgroundColor: `var(--dashboard-button) !important`,
            color: 'var(--dashboard-button-foreground)',
            border: 'none',
            transition: 'background-color 200ms ease',
            '&:not(:disabled)': {
              backgroundColor: `var(--dashboard-button) !important`,
              '&:hover': {
                backgroundColor: `var(--dashboard-button-hover) !important`,
              },
              '&:active': {
                backgroundColor: `var(--dashboard-button) !important`,
              },
            },
            '&:disabled': {
              backgroundColor: `var(--background-faded) !important`,
              color: 'var(--foreground-faded)',
              opacity: 0.6,
            },
          }}
        >
          {t('feedback.submit')}
        </Button>
      </Group>
    </Modal>
  )
}
