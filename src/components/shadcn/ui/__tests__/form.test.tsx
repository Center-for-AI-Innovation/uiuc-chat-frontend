import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '../form'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  componentDidCatch(error: Error) {
    this.setState({ error })
  }
  render() {
    if (this.state.error) {
      return <div data-testid="caught">{this.state.error.message}</div>
    }
    return this.props.children
  }
}

describe('shadcn form', () => {
  it('guards useFormField usage', () => {
    const Bad = () => {
      useFormField()
      return null
    }

    render(
      <ErrorBoundary>
        <Bad />
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('caught')).toHaveTextContent(/useFormField/i)
  })

  it('renders form field ids, description, and error message', () => {
    function Harness() {
      const methods = useForm<{ name: string }>({ defaultValues: { name: '' } })
      React.useEffect(() => {
        methods.setError('name', { message: 'Required' })
      }, [methods])

      return (
        <Form {...methods}>
          <form>
            <FormField
              control={methods.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <input aria-label="name" {...field} />
                  </FormControl>
                  <FormDescription>Help</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )
    }

    render(<Harness />)
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('renders FormMessage children when no error', () => {
    function Harness() {
      const methods = useForm<{ name: string }>({ defaultValues: { name: '' } })
      return (
        <Form {...methods}>
          <form>
            <FormField
              control={methods.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <input aria-label="name" {...field} />
                  </FormControl>
                  <FormMessage>OK</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>
      )
    }

    render(<Harness />)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })
})
