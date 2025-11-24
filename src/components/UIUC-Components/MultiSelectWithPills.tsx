import * as React from 'react'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/ui/popover'
import { Checkbox } from '@/components/shadcn/ui/checkbox'
import { Label } from '@/components/shadcn/ui/label'
import { IconChevronDown, IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectWithPillsProps {
  options: MultiSelectOption[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  showAllOption?: boolean
  allOptionLabel?: string
  className?: string
}

export function MultiSelectWithPills({
  options,
  selected,
  onSelectionChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found',
  showAllOption = false,
  allOptionLabel = 'All',
  className,
}: MultiSelectWithPillsProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    )
  }, [options, searchQuery])

  // Handle "All" option
  const allSelected = showAllOption && selected.length === options.length && options.length > 0
  const displaySelected = allSelected ? [allOptionLabel] : selected

  const handleToggle = (value: string) => {
    if (showAllOption && value === allOptionLabel) {
      // Toggle all
      if (allSelected) {
        onSelectionChange([])
      } else {
        onSelectionChange(options.map((opt) => opt.value))
      }
    } else {
      if (selected.includes(value)) {
        const newSelected = selected.filter((v) => v !== value)
        onSelectionChange(newSelected)
      } else {
        const newSelected = [...selected, value]
        // If all options are now selected and showAllOption is true, keep individual selection
        // (don't auto-select "All" - let user explicitly select it)
        onSelectionChange(newSelected)
      }
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selected.filter((v) => v !== value))
  }

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => selected.includes(opt.value))
  }, [options, selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between min-h-[2.5rem] h-auto py-2 px-3 border-0 bg-muted/50 hover:bg-muted shadow-sm',
            className,
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {displaySelected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : allSelected ? (
              <Badge variant="secondary" className="mr-1 bg-primary/10 text-primary border-primary/20">
                {allOptionLabel}
              </Badge>
            ) : (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1 gap-1 pr-1 bg-secondary text-secondary-foreground border border-border"
                >
                  <span className="max-w-[200px] truncate font-medium">{option.label}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.value, e)}
                    className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-0 shadow-xl bg-popover" align="start">
        <div className="p-2">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border-0 bg-muted/50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-2"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {showAllOption && (
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={() => handleToggle(allOptionLabel)}
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-semibold cursor-pointer flex-1 text-foreground"
              >
                {allOptionLabel}
              </Label>
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 border border-transparent hover:border-border transition-colors cursor-pointer"
                    onClick={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      id={`option-${option.value}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(option.value)}
                    />
                    <Label
                      htmlFor={`option-${option.value}`}
                      className="text-sm font-normal cursor-pointer flex-1 text-foreground"
                    >
                      {option.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

