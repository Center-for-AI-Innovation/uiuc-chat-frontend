import React from 'react'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title?: string
  message: string
  type?: ToastType
  autoClose?: number
  icon?: React.ReactNode
}

const getToastConfig = (type: ToastType) => {
  const configs = {
    success: {
      color: 'green' as const,
      icon: React.createElement(IconCheck),
      defaultAutoClose: 5000,
    },
    error: {
      color: 'red' as const,
      icon: React.createElement(IconAlertCircle),
      defaultAutoClose: 8000,
    },
    warning: {
      color: 'yellow' as const,
      icon: React.createElement(IconAlertCircle),
      defaultAutoClose: 6000,
    },
    info: {
      color: 'blue' as const,
      icon: React.createElement(IconInfoCircle),
      defaultAutoClose: 5000,
    },
  }
  return configs[type]
}

export const showToast = ({
  title,
  message,
  type = 'info',
  autoClose,
  icon,
}: ToastOptions) => {
  const config = getToastConfig(type)
  
  notifications.show({
    title,
    message,
    color: config.color,
    icon: icon || config.icon,
    autoClose: autoClose || config.defaultAutoClose,
    styles: {
      root: {
        backgroundColor: 'var(--notification)',
        borderColor: 'var(--notification-border)',
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
        color: 'var(--notification-title)',
      },
    },
  })
}

// Convenience functions for common use cases
export const showSuccessToast = (message: string, title?: string) => {
  showToast({ message, title, type: 'success' })
}

export const showErrorToast = (message: string, title?: string) => {
  showToast({ message, title, type: 'error' })
}

export const showWarningToast = (message: string, title?: string) => {
  showToast({ message, title, type: 'warning' })
}

export const showInfoToast = (message: string, title?: string) => {
  showToast({ message, title, type: 'info' })
}
