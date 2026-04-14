import React from 'react'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Button } from '@/components/shadcn/ui/button'
import { IconX } from '@tabler/icons-react'
import { type FieldApi } from '@tanstack/react-form'

export function CredentialInput({
  field,
  placeholder,
}: {
  field: any
  placeholder: string
}) {
  return (
    <div className="mb-4 w-full">
      <Label className="text-[--dashboard-foreground-faded]">
        {placeholder}
      </Label>
      <div className="mt-1 flex items-center gap-2">
        <Input
          type="password"
          placeholder={placeholder}
          aria-label={placeholder}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          className="flex-1 bg-[--background] text-[--foreground]"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[--foreground-faded] hover:bg-[--dashboard-button] hover:text-[--dashboard-button-foreground]"
          onClick={(e) => {
            e.preventDefault()
            field.handleChange('')
          }}
          aria-label="Clear"
        >
          <IconX size={12} />
        </Button>
      </div>
      <FieldInfo field={field} />
    </div>
  )
}

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="mt-1 text-xs text-red-500">
          {field.state.meta.errors.join(', ')}
        </p>
      ) : null}
      {field.state.meta.isValidating ? (
        <p className="mt-1 text-xs">Validating...</p>
      ) : null}
    </>
  )
}
