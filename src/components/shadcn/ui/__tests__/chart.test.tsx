import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('recharts', () => ({
  __esModule: true,
  ResponsiveContainer: ({ children }: any) =>
    React.createElement(
      React.Fragment,
      null,
      typeof children === 'function' ? children({}) : children,
    ),
  Tooltip: (props: any) => React.createElement('div', props),
  Legend: (props: any) => React.createElement('div', props),
}))

import {
  ChartContainer,
  ChartLegendContent,
  ChartStyle,
  ChartTooltipContent,
} from '../chart'

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
      return <div data-testid="caught-error">{this.state.error.message}</div>
    }
    return this.props.children
  }
}

describe('shadcn chart', () => {
  it('throws when tooltip content is used outside ChartContainer', () => {
    render(
      <ErrorBoundary>
        <ChartTooltipContent active payload={[]} />
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('caught-error')).toHaveTextContent(
      /useChart must be used within a <ChartContainer/i,
    )
  })

  it('renders ChartStyle only when config contains colors', () => {
    const { container, rerender } = render(
      (<ChartStyle id="chart-1" config={{}} />) as any,
    )
    expect(container).toBeEmptyDOMElement()

    rerender(
      (
        <ChartStyle
          id="chart-2"
          config={{
            foo: { label: 'Foo', color: 'red' },
            bar: { label: 'Bar', theme: { light: 'blue', dark: 'green' } },
          }}
        />
      ) as any,
    )
    const style = container.querySelector('style')
    expect(style).toBeTruthy()
    expect(style?.innerHTML).toContain('--color-foo')
    expect(style?.innerHTML).toContain('--color-bar')
  })

  it('renders tooltip + legend content inside ChartContainer', () => {
    render(
      (
        <ChartContainer
          config={{
            value: { label: 'Value', color: 'red' },
            x: { label: 'X', color: 'blue' },
          }}
        >
          {() => (
            <div>
              <ChartTooltipContent
                active
                indicator="line"
                payload={[
                  {
                    dataKey: 'value',
                    name: 'value',
                    value: 42,
                    color: 'red',
                    payload: { fill: 'red', value: 'value' },
                  },
                ]}
              />
              <ChartLegendContent
                payload={[
                  {
                    dataKey: 'x',
                    value: 'x',
                    color: 'blue',
                    type: 'square',
                  },
                ]}
              />
            </div>
          )}
        </ChartContainer>
      ) as any,
    )

    // Value label appears in tooltip
    expect(screen.getAllByText(/Value/i).length).toBeGreaterThan(0)
    // Legend shows config label
    expect(screen.getByText(/X/i)).toBeInTheDocument()
  })
})
