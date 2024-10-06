import React, { useEffect, useState } from 'react'
import {
  Button,
  Text,
  Card,
  Flex,
  Title,
  Stack,
  Input,
  ActionIcon,
  TextInput,
  Select,
} from '@mantine/core'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi } from '@tanstack/react-form'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import {
  AllLLMProviders,
  AnthropicProvider,
  AzureProvider,
  NCSAHostedProvider,
  OllamaProvider,
  OpenAIProvider,
  ProviderNames,
  WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react'
import { GetCurrentPageName } from './CanViewOnlyCourse'
import GlobalFooter from './GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Navbar from './navbars/Navbar'
import Head from 'next/head'
import { getModelLogo, ModelItem } from '~/components/Chat/ModelSelect'
import CanvasIngestForm from './CanvasIngestForm'
import WebsiteIngestForm from './WebsiteIngestForm'
import LargeDropzone from './LargeDropzone'
import router from 'next/router'


export default function IngestLinkForm() {
  const projectName = GetCurrentPageName()



  return (
    <>

      <CanvasIngestForm
      // provider={
      //   llmProviders?.Anthropic as AnthropicProvider
      // }
      // form={form}
      // isLoading={isLoadingLLMProviders}
      />
      <WebsiteIngestForm
      // provider={
      //   llmProviders?.Anthropic as AnthropicProvider
      // }
      // form={form}
      // isLoading={isLoadingLLMProviders}
      />

    </>
  )
}

export const showConfirmationToast = ({
  title,
  message,
  isError = false,
}: {
  title: string
  message: string
  isError?: boolean
}) => {
  return (
    // docs: https://mantine.dev/others/notifications/

    notifications.show({
      id: 'confirmation-toast',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 6000,
      title: title,
      message: message,
      icon: isError ? <IconAlertCircle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: isError
            ? '#FEE2E2' // errorBackground
            : '#F9FAFB', // nearlyWhite
          borderColor: isError
            ? '#FCA5A5' // errorBorder
            : '#8B5CF6', // aiPurple
        },
        title: {
          color: '#111827', // nearlyBlack
        },
        description: {
          color: '#111827', // nearlyBlack
        },
        closeButton: {
          color: '#111827', // nearlyBlack
          '&:hover': {
            backgroundColor: '#F3F4F6', // dark[1]
          },
        },
      },
      loading: false,
    })
  )
}

