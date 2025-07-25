import React, { useState } from 'react';
import {
  Modal,
  Button,
  Textarea,
  Select,
  createStyles,
  useMantineTheme,
  Text,
  Group,
  MantineTheme,
} from '@mantine/core';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

const useStyles = createStyles((theme: MantineTheme) => ({
  root: {
    backgroundColor: theme.colors.dark[7],
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
  },
  title: {
    color: theme.white,
    fontSize: theme.fontSizes.xl,
    fontWeight: 700,
    marginBottom: 0,
  },
  close: {
    color: theme.white,
    '&:hover': {
      backgroundColor: theme.colors.dark[6],
    },
  },
  textarea: {
    backgroundColor: theme.colors.dark[6],
    borderColor: theme.colors.dark[4],
    color: theme.white,
    '&::placeholder': {
      color: theme.colors.dark[2],
    },
    '&:focus': {
      borderColor: theme.colors.violet[4],
    },
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.white,
    marginBottom: theme.spacing.xs,
  },
}));

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string, category: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const [feedback, setFeedback] = useState<string>('');
  const [category, setCategory] = useState<string>('other');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const lang = i18n.language || router.locale || 'en';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(feedback, category);
      setFeedback('');
      setCategory('other');
      onClose();
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text className={classes.title}>{t('feedback')}</Text>}
      classNames={classes}
      centered
      withCloseButton={false}
      overlayProps={{
        color: theme.colors.dark[9],
        opacity: 0.75,
        blur: 3,
      }}
      styles={{
        header: { zIndex: 1 },
      }}
    >
      <Select
        label={t('feedback_category')}
        placeholder={t('feedback_category_placeholder')}
        data={[
          { value: 'inaccurate', label: t('feedback_inaccurate') },
          { value: 'inappropriate', label: t('feedback_inappropriate') },
          { value: 'unclear', label: t('feedback_unclear') },
          { value: 'ui_bug', label: t('feedback_ui_bug') },
          { value: 'overactive_refusal', label: t('feedback_overactive_refusal') },
          { value: 'incomplete_request', label: t('feedback_incomplete_request') },
          { value: 'other', label: t('feedback_other') },
        ]}
        value={category}
        onChange={(value) => setCategory(value || 'other')}
        mt={0}
        mb="xl"
        withinPortal
        styles={(theme) => ({
          input: {
            backgroundColor: theme.colors.dark[6],
            borderColor: theme.colors.dark[4],
            color: theme.white,
            '&::placeholder': {
              color: theme.colors.dark[2],
            },
            '&:focus': {
              borderColor: theme.colors.violet[4],
            },
          },
          dropdown: {
            backgroundColor: theme.colors.dark[6],
            borderColor: theme.colors.dark[4],
            maxHeight: '250px',
            overflowY: 'auto',
          },
          item: {
            color: theme.white,
            '&[data-selected]': {
              backgroundColor: theme.colors.violet[6],
              color: theme.white,
            },
            '&[data-hovered]': {
              backgroundColor: theme.colors.violet[5],
            },
          },
          label: {
            color: theme.white,
            marginBottom: theme.spacing.xs,
          },
        })}
        aria-label={t('feedback_category')}
      />
      <Textarea
        label={
          <Group spacing={4}>
            <Text>{t('feedback_details')}</Text>
            <Text size="sm" color="dimmed">
              {t('optional')}
            </Text>
          </Group>
        }
        placeholder={t('feedback_details_placeholder')}
        value={feedback}
        onChange={(event) => setFeedback(event.currentTarget.value)}
        minRows={4}
        mb="md"
        classNames={{ input: classes.textarea }}
        aria-label={t('feedback_details')}
      />

      <Group className={classes.buttonGroup}>
        <Button
          onClick={onClose}
          variant="outline"
          aria-label={t('cancel')}
          sx={{
            backgroundColor: 'transparent',
            color: theme.white,
            border: `1px solid ${theme.colors.dark[3]}`,
            '&:hover': {
              backgroundColor: theme.colors.dark[6],
            },
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          aria-label={t('feedback.submit_aria')}
          sx={{
            backgroundColor: `${theme.colors.violet[5]} !important`,
            color: theme.white,
            border: 'none',
            transition: 'background-color 200ms ease',
            '&:not(:disabled)': {
              backgroundColor: `${theme.colors.violet[5]} !important`,
              '&:hover': {
                backgroundColor: `${theme.colors.violet[6]} !important`,
              },
              '&:active': {
                backgroundColor: `${theme.colors.violet[7]} !important`,
              },
            },
            '&:disabled': {
              backgroundColor: `${theme.colors.dark[5]} !important`,
              color: theme.colors.dark[3],
              opacity: 0.6,
            },
          }}
        >
          {t('submit')}
        </Button>
      </Group>
    </Modal>
  );
};
