'use client'

import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/components/shadcn/lib/utils'

const formInputGroupVariants = cva(
  [
    'flex w-full items-center rounded-md border bg-[--background] transition-colors',
    'has-[>textarea]:items-stretch',
  ],
  {
    variants: {
      status: {
        default:
          'border-[--dashboard-border] focus-within:border-[--foreground]',
        success: 'border-[--illinois-prairie]',
        error: 'border-[--error]',
        loading:
          'border-[--foreground-faded] focus-within:border-[--foreground]',
      },
    },
    defaultVariants: {
      status: 'default',
    },
  },
)

type FormInputStatus = NonNullable<
  VariantProps<typeof formInputGroupVariants>['status']
>

interface FormInputProps {
  as?: 'input' | 'textarea'
  label?: string
  required?: boolean
  description?: string
  status?: FormInputStatus
  errorMessage?: string
  successMessage?: string
  rightSlot?: React.ReactNode
  disabled?: boolean
  autoFocus?: boolean
  placeholder?: string
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onInput?: React.FormEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
  name?: string
  autoComplete?: string
  minRows?: number
  maxRows?: number
  className?: string
  inputClassName?: string
}

const LINE_HEIGHT = 22 // approximate line-height in px for text-sm/md

const FormInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps
>(
  (
    {
      as = 'input',
      label,
      required,
      description,
      status = 'default',
      errorMessage,
      successMessage,
      rightSlot,
      disabled,
      autoFocus,
      placeholder,
      value,
      onChange,
      onInput,
      onFocus,
      name,
      autoComplete,
      minRows = 2,
      maxRows,
      className,
      inputClassName,
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)

    const textareaRef =
      (forwardedRef as React.Ref<HTMLTextAreaElement>) ?? internalRef

    const adjustHeight = useCallback(() => {
      const el =
        typeof textareaRef === 'object' && textareaRef !== null
          ? textareaRef.current
          : null
      if (!el || as !== 'textarea') return

      el.style.height = 'auto'
      const minH = minRows * LINE_HEIGHT
      const maxH = maxRows ? maxRows * LINE_HEIGHT : Infinity
      const scrollH = el.scrollHeight
      el.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`
      el.style.overflowY = scrollH > maxH ? 'auto' : 'hidden'
    }, [as, minRows, maxRows, textareaRef])

    useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    const sharedClasses = cn(
      'w-full bg-transparent px-3 py-2 text-sm text-[--foreground] placeholder:text-[--foreground-faded]',
      'outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
      inputClassName,
    )

    const statusMessage =
      status === 'error'
        ? errorMessage
        : status === 'success'
          ? successMessage
          : undefined

    const statusTextColor =
      status === 'error'
        ? 'text-[--error]'
        : status === 'success'
          ? 'text-[--illinois-prairie]'
          : ''

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label className="text-base font-semibold text-[--foreground]">
            {label}
            {required && <span className="ml-0.5 text-[--error]">*</span>}
          </label>
        )}

        {description && (
          <p className="text-sm text-[--foreground-faded]">{description}</p>
        )}

        <div
          className={cn(formInputGroupVariants({ status }))}
          data-disabled={disabled || undefined}
        >
          {as === 'textarea' ? (
            <textarea
              ref={textareaRef}
              className={cn(sharedClasses, 'resize-none')}
              style={{ minHeight: minRows * LINE_HEIGHT }}
              disabled={disabled}
              autoFocus={autoFocus}
              placeholder={placeholder}
              value={value}
              onChange={
                onChange as React.ChangeEventHandler<HTMLTextAreaElement>
              }
              onInput={(e) => {
                adjustHeight()
                ;(onInput as React.FormEventHandler<HTMLTextAreaElement>)?.(e)
              }}
              onFocus={onFocus as React.FocusEventHandler<HTMLTextAreaElement>}
              name={name}
              autoComplete={autoComplete}
            />
          ) : (
            <input
              ref={forwardedRef as React.Ref<HTMLInputElement>}
              type="text"
              className={sharedClasses}
              disabled={disabled}
              autoFocus={autoFocus}
              placeholder={placeholder}
              value={value}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              onInput={onInput as React.FormEventHandler<HTMLInputElement>}
              onFocus={onFocus as React.FocusEventHandler<HTMLInputElement>}
              name={name}
              autoComplete={autoComplete}
            />
          )}

          {rightSlot && (
            <div className="flex shrink-0 items-center pr-3">{rightSlot}</div>
          )}
        </div>

        {statusMessage && (
          <p className={cn('text-sm', statusTextColor)}>{statusMessage}</p>
        )}
      </div>
    )
  },
)

FormInput.displayName = 'FormInput'

export { FormInput, type FormInputProps, type FormInputStatus }
