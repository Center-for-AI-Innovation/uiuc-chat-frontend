import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '../field'

describe('shadcn field', () => {
  it('renders structural field components and error variants', () => {
    const { rerender } = render(
      <FieldSet>
        <FieldLegend>Legend</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldTitle>Title</FieldTitle>
            <FieldContent>
              <FieldDescription>Desc</FieldDescription>
              <FieldError errors={[{ message: 'one' }]} />
            </FieldContent>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <FieldError
            errors={[{ message: 'a' }, { message: 'b' }]}
            data-testid="multi"
          />
        </FieldGroup>
      </FieldSet>,
    )

    expect(screen.getByText('Legend')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByTestId('multi')).toHaveTextContent('a')
    expect(screen.getByTestId('multi')).toHaveTextContent('b')

    // No errors renders nothing
    rerender(<FieldError errors={[]} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
