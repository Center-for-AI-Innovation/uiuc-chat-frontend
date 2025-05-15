import React from 'react';
import {
  Modal,
  Text,
  Flex,
  Group,
  Button,
  type MantineTheme,
} from '@mantine/core';
import { type NextFont } from 'next/dist/compiled/@next/font'; // For type hinting

interface DeleteCustomPromptModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  promptName: string | undefined; // Name of the prompt to be deleted, can be undefined if promptToDelete is null
  theme: MantineTheme;
  montserrat_heading: NextFont;
  montserrat_paragraph: NextFont;
}

const DeleteCustomPromptModal: React.FC<DeleteCustomPromptModalProps> = ({
  opened,
  onClose,
  onConfirm,
  promptName,
  montserrat_heading,
  montserrat_paragraph,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text
          className={`${montserrat_heading.className} font-montserratHeading`}
          size="lg"
          weight={700}
          variant="gradient"
          gradient={{ from: 'red', to: 'orange', deg: 45 }}
        >
          Confirm Deletion
        </Text>
      }
      centered
      size="md"
      radius="md"
      styles={{
        header: {
          backgroundColor: '#15162c',
          borderBottom: '1px solid #2D2F48',
          padding: '20px 24px',
          marginBottom: '16px',
        },
        content: {
          backgroundColor: '#15162c',
          border: '1px solid #2D2F48',
        },
        body: {
          padding: '0 24px 24px 24px',
        },
        title: {
          marginBottom: '0',
        },
        close: {
          marginTop: '4px',
          color: '#D1D1D1',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        },
      }}
    >
      <Flex direction="column" gap="md">
        <Text className={`${montserrat_paragraph.className} font-montserratParagraph`} color="white">
          Are you sure you want to delete the custom prompt &quot;
          {promptName || ''}&quot;? This action cannot be undone.
        </Text>
        <Group position="right" mt="md">
          <Button
            variant="outline"
            color="gray"
            onClick={onClose}
            className={`${montserrat_paragraph.className} font-montserratParagraph`}
            styles={(themeParam) => ({
              root: {
                borderColor: themeParam.colors.gray[6],
                color: '#fff',
                '&:hover': {
                  backgroundColor: themeParam.colors.gray[8],
                },
              },
            })}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            radius="md"
            onClick={onConfirm} // Use onConfirm from props
            className={`${montserrat_paragraph.className} font-montserratParagraph`}
            sx={(themeParam) => ({
              backgroundColor: `${themeParam.colors.red[8]} !important`,
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${themeParam.colors.red[9]} !important`,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              },
            })}
          >
            Delete
          </Button>
        </Group>
      </Flex>
    </Modal>
  );
};

export default DeleteCustomPromptModal; 