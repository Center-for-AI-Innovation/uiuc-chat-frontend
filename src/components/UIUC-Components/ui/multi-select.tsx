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
  const [activeIndex, setActiveIndex] = React.useState<number>(-1)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [open])

  // Filter options based on search query
  const filteredOptions = React.useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [options, searchQuery],
  )

  const selectedItems = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected],
  )

  const handleSelect = React.useCallback(
    (value: string, checked: boolean) => {
      onChange(
        checked ? [...selected, value] : selected.filter((v) => v !== value),
      )
    },
    [onChange, selected],
  )

  const removeItem = React.useCallback(
    (valueToRemove: string) => {
      onChange(selected.filter((value) => value !== valueToRemove))
    },
    [onChange, selected],
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          const option = filteredOptions[activeIndex]
          if (option) {
            handleSelect(option.value, !selected.includes(option.value))
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    // Prevent click from bubbling up and closing the dropdown
    e.stopPropagation()
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
          ref={dropdownRef}
          className={cn(
            'w-full min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-t-none border-white/10 bg-[#15162c] p-0',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'data-[state=closed]:slide-out-to-top-0',
          )}
          align="start"
          sideOffset={0}
          onClick={handleDropdownClick}
        >
          <div className="flex items-center border-t border-white/10 px-3 py-2">
            <div className="relative flex w-full items-center">
              <input
                ref={searchInputRef}
                className="flex h-8 w-full rounded-md bg-[#15162c] px-3 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setActiveIndex(-1)
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-2 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[280px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/50">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selected.includes(option.value)}
                  onSelect={(e) => {
                    // Prevent the dropdown from closing
                    e.preventDefault()
                  }}
                  onCheckedChange={(checked) => {
                    handleSelect(option.value, checked)
                    // Keep focus on search input after selection
                    searchInputRef.current?.focus()
                  }}
                  className={cn(
                    'text-white hover:text-white focus:bg-indigo-600 data-[state=checked]:bg-purple-800',
                    index === activeIndex && 'bg-indigo-600',
                  )}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedItems.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#15162c]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">
                Selected Documents
              </span>
              <span className="rounded-full bg-purple-800/50 px-2 py-0.5 text-xs text-white/80">
                {selectedItems.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange([])}
              className="focus:bg-white/15 rounded-md bg-white/5 px-2 py-1 text-xs text-white/60 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-[200px] overflow-auto p-2">
            <div className="space-y-1">
              {selectedItems.map((item, index) => (
                <div
                  key={item.value}
                  className="flex items-center justify-between rounded-md bg-black/20 px-3 py-2 text-sm text-white/90"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">#{index + 1}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  <button
                    onClick={() => removeItem(item.value)}
                    className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
