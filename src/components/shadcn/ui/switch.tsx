'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip'

import { cn } from '@/components/shadcn/lib/utils'

const switchVariants = cva(
  'peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'border-transparent data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-white/15',
        labeled:
          'data-[state=checked]:border-[var(--dashboard-button)] data-[state=checked]:bg-[var(--dashboard-button)] data-[state=unchecked]:border-[var(--dashboard-background-darker)] data-[state=unchecked]:bg-[var(--dashboard-background-dark)] dark:data-[state=unchecked]:border-white/25 dark:data-[state=unchecked]:bg-white/15',
      },
      size: {
        sm: 'h-5 w-10',
        default: 'h-6 w-12',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const switchThumbVariants = cva(
  'pointer-events-none flex items-center justify-center rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4)] ring-0 transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        default:
          'h-5 w-5 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0',
        lg: 'h-[24px] w-[24px] data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

const switchTrackLabelVariants = cva(
  'absolute font-semibold transition-opacity duration-200',
  {
    variants: {
      size: {
        sm: 'text-[6px]',
        default: 'text-[9px]',
        lg: 'text-[9px]',
      },
      position: {
        on: 'left-1.5',
        off: 'right-1',
      },
    },
    defaultVariants: {
      size: 'default',
      position: 'on',
    },
  },
)

const switchContainerVariants = cva(
  'flex items-center rounded-lg p-2 transition-all duration-200 ease-in-out',
  {
    variants: {
      disabled: {
        true: 'opacity-60',
        false: 'cursor-pointer hover:bg-white/10',
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
)

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  /** Show ON/OFF labels on track */
  showLabels?: boolean
  /** Custom on label text */
  onLabel?: string
  /** Custom off label text */
  offLabel?: string
  /** Show check/x icons in thumb */
  showThumbIcon?: boolean
  /** Text label displayed next to switch */
  label?: string
  /** Tooltip text for the info icon */
  tooltip?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      variant,
      size,
      showLabels = false,
      onLabel = 'ON',
      offLabel = 'OFF',
      showThumbIcon = false,
      label,
      tooltip,
      disabled,
      checked,
      onCheckedChange,
      ...props
    },
    ref,
  ) => {
    // Only wrap in container when there's actually a label or tooltip to show
    const hasLabelOrTooltip = !!(label || tooltip)

    const switchElement = (
      <SwitchPrimitives.Root
        className={cn(switchVariants({ variant, size }), className)}
        disabled={disabled}
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
        {...props}
        ref={ref}
      >
        {/* Track Labels */}
        {showLabels && (
          <>
            <span
              className={cn(
                switchTrackLabelVariants({ size, position: 'on' }),
                checked ? 'text-white opacity-100' : 'opacity-0',
              )}
            >
              {onLabel}
            </span>
            <span
              className={cn(
                switchTrackLabelVariants({ size, position: 'off' }),
                !checked
                  ? 'text-gray-400 opacity-100 dark:text-gray-300'
                  : 'opacity-0',
              )}
            >
              {offLabel}
            </span>
          </>
        )}

        <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))}>
          {showThumbIcon &&
            (checked ? (
              <IconCheck
                size={12}
                className={cn(
                  'stroke-[3]',
                  disabled
                    ? 'text-gray-400'
                    : 'text-[var(--dashboard-button,hsl(var(--primary)))]',
                )}
              />
            ) : (
              <IconX size={12} className="stroke-[3] text-gray-400" />
            ))}
        </SwitchPrimitives.Thumb>
      </SwitchPrimitives.Root>
    )

    // Return just the switch if no label/tooltip
    if (!hasLabelOrTooltip) {
      return switchElement
    }

    // Return switch with label and optional tooltip
    return (
      <div
        className={cn(
          switchContainerVariants({ disabled: !!disabled }),
          'group',
        )}
        onClick={(e) => {
          if (disabled) return
          e.preventDefault()
          onCheckedChange?.(!checked)
        }}
      >
        {switchElement}

        {label && (
          <span
            className={cn(
              'ml-3 flex items-center text-sm transition-colors duration-200 ease-in-out',
              'text-[var(--dashboard-foreground,hsl(var(--foreground)))]',
            )}
          >
            {label}

            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="ml-2 cursor-pointer transition-transform duration-200 ease-in-out"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconInfoCircle
                        size={16}
                        className="text-gray-400 transition-all duration-200 ease-in-out group-hover:text-gray-500 dark:text-gray-300 dark:group-hover:text-gray-200"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[220px] bg-[var(--tooltip-background,hsl(var(--popover)))] text-[var(--tooltip,hsl(var(--popover-foreground)))] shadow-lg"
                  >
                    <p className="text-sm">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        )}
      </div>
    )
  },
)
Switch.displayName = SwitchPrimitives.Root.displayName

export {
  Switch,
  switchVariants,
  switchThumbVariants,
  switchTrackLabelVariants,
  switchContainerVariants,
}
export type { SwitchProps }
