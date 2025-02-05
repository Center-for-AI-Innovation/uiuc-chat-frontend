'use client'

import * as React from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'

export interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      // Small delay to ensure the dropdown is fully rendered
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [open])

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedItems = options.filter((option) =>
    selected.includes(option.value),
  )

  const handleSelect = (value: string, checked: boolean) => {
    onChange(
      checked ? [...selected, value] : selected.filter((v) => v !== value),
    )
  }

  const removeItem = (valueToRemove: string) => {
    onChange(selected.filter((value) => value !== valueToRemove))
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between border-white/10 bg-[#15162c] font-normal text-white hover:bg-[#15162c]/90',
              open && 'rounded-b-none',
              className,
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selected.length === 0
                ? placeholder
                : `${selected.length} document${selected.length === 1 ? '' : 's'} selected`}
            </span>
            {open ? (
              <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            'w-full min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-t-none border-white/10 bg-[#15162c] p-0',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'data-[state=closed]:slide-out-to-top-0',
          )}
          align="start"
          sideOffset={0}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center border-t border-white/10 px-3 py-2">
            <input
              ref={searchInputRef}
              className="flex h-8 w-full rounded-md bg-[#15162c] px-3 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[280px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/50">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) => {
                    handleSelect(option.value, checked)
                    // Refocus the search input after selection
                    setTimeout(() => {
                      searchInputRef.current?.focus()
                    }, 0)
                  }}
                  className="text-white hover:text-white focus:bg-indigo-600 data-[state=checked]:bg-purple-800"
                  onSelect={(e) => e.preventDefault()}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <div
              key={item.value}
              className="bg-grape-800/50 flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-white"
            >
              <span className="truncate">{item.label}</span>
              <button
                onClick={() => removeItem(item.value)}
                className="hover:bg-grape-600 ml-1 cursor-pointer rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
