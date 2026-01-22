import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('recharts', () => {
  const Stub = (name: string) => (props: any) =>
    React.createElement('div', { 'data-testid': `recharts-${name}`, ...props })
  return {
    __esModule: true,
    ResponsiveContainer: Stub('ResponsiveContainer'),
    Tooltip: Stub('Tooltip'),
    Legend: Stub('Legend'),
    BarChart: Stub('BarChart'),
    Bar: Stub('Bar'),
    XAxis: Stub('XAxis'),
    YAxis: Stub('YAxis'),
    CartesianGrid: Stub('CartesianGrid'),
    PieChart: Stub('PieChart'),
    Pie: Stub('Pie'),
    Cell: Stub('Cell'),
  }
})

import ConversationsPerHourChart from '../ConversationsPerHourChart'

describe('ConversationsPerHourChart', () => {
  it('renders loading, error, and chart states', () => {
    const { rerender } = render(
      <ConversationsPerHourChart isLoading error={null} />,
    )
    expect(screen.getByText(/Loading chart/i)).toBeInTheDocument()

    rerender(<ConversationsPerHourChart isLoading={false} error="oops" />)
    expect(screen.getByText('oops')).toBeInTheDocument()

    rerender(
      <ConversationsPerHourChart
        isLoading={false}
        error={null}
        data={{ '0': 1, '12': 3 }}
      />,
    )
    expect(screen.getByTestId('recharts-ResponsiveContainer')).toBeInTheDocument()
    expect(screen.getByTestId('recharts-BarChart')).toBeInTheDocument()
  })
})
