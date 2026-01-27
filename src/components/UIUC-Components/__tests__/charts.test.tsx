import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('recharts', () => {
  const Stub =
    (name: string, callProps?: (props: any) => void) =>
    (() => {
      const Component = (props: any) => {
        try {
          callProps?.(props)
        } catch {
          // ignore
        }
        return React.createElement('div', { 'data-recharts': name }, props.children)
      }
      Component.displayName = `Recharts.${name}`
      return Component
    })()

  return {
    __esModule: true,
    ResponsiveContainer: Stub('ResponsiveContainer'),
    BarChart: Stub('BarChart'),
    PieChart: Stub('PieChart'),
    CartesianGrid: Stub('CartesianGrid'),
    Bar: Stub('Bar'),
    Cell: Stub('Cell'),
    XAxis: Stub('XAxis', (p) => {
      p.tickFormatter?.('2024-01-01')
      p.labelFormatter?.('x')
    }),
    YAxis: Stub('YAxis'),
    Legend: Stub('Legend', (p) => {
      p.formatter?.('Label', { payload: { percentage: '1.0' } })
    }),
    Tooltip: Stub('Tooltip', (p) => {
      p.formatter?.(10, 'name', { payload: { percentage: '1.0' } })
      p.labelFormatter?.('label')
    }),
    Pie: Stub('Pie', (p) => {
      // Call the label renderer twice to cover both branches.
      if (typeof p.label === 'function') {
        p.label({
          cx: 100,
          cy: 100,
          midAngle: 0,
          innerRadius: 40,
          outerRadius: 60,
          percent: 0.01,
          name: 'Tiny',
          fill: '#1f77b4',
        })
        p.label({
          cx: 100,
          cy: 100,
          midAngle: 45,
          innerRadius: 40,
          outerRadius: 60,
          percent: 0.2,
          name: 'Long model name for truncation',
          fill: '#ff7f0e',
        })
      }
    }),
  }
})

vi.mock('react-grid-heatmap', () => ({
  __esModule: true,
  HeatMapGrid: (props: any) => {
    props.xLabelsStyle?.()
    props.yLabelsStyle?.()
    props.cellStyle?.(0, 0, 0.5)
    props.cellRender?.(0, 0, 1)
    return React.createElement('div', { 'data-testid': 'heatmap' })
  },
}))

import ConversationsPerDayChart from '../ConversationsPerDayChart'
import ConversationsPerHourChart from '../ConversationsPerHourChart'
import ConversationsPerDayOfWeekChart from '../ConversationsPerDayOfWeekChart'
import ConversationsHeatmapByHourChart from '../ConversationsHeatmapByHourChart'
import ModelUsageChart from '../ModelUsageChart'

describe('UIUC charts', () => {
  it('covers loading/error/no-data branches', () => {
    render(<ConversationsPerDayChart isLoading data={undefined} error={null} />)
    expect(screen.getByText(/Loading chart/i)).toBeInTheDocument()

    render(<ConversationsPerHourChart isLoading={false} data={undefined} error="boom" />)
    expect(screen.getByText(/boom/i)).toBeInTheDocument()

    render(
      <ConversationsPerDayOfWeekChart isLoading={false} data={undefined} error={null} />,
    )
    expect(screen.getByText(/No data available/i)).toBeInTheDocument()

    render(
      <ConversationsHeatmapByHourChart isLoading={false} data={undefined} error={null} />,
    )
    expect(screen.getAllByText(/No data available/i).length).toBeGreaterThan(0)

    render(<ModelUsageChart isLoading error={null} data={null} />)
    expect(screen.getByText(/Loading model usage data/i)).toBeInTheDocument()

    render(<ModelUsageChart isLoading={false} error="err" data={[]} />)
    expect(screen.getByText(/Error loading model usage data/i)).toBeInTheDocument()
  })

  it('covers data rendering + interactions', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ConversationsPerDayChart
        isLoading={false}
        error={null}
        data={{ '2024-01-01': 1, '2024-01-02': 10 }}
      />,
    )
    expect(screen.getByRole('region', { name: /Conversations per day/i })).toBeInTheDocument()
    await user.click(
      screen.getByRole('switch', {
        name: /Toggle between linear and logarithmic scale/i,
      }),
    )

    render(
      <ConversationsPerHourChart
        isLoading={false}
        error={null}
        data={{ '0': 1, '1': 2, '2': 3 }}
      />,
    )
    expect(document.querySelectorAll('[data-recharts]').length).toBeGreaterThan(0)

    render(
      <ConversationsPerDayOfWeekChart
        isLoading={false}
        error={null}
        data={{ Monday: 2, Tuesday: 1 }}
      />,
    )
    expect(document.querySelectorAll('[data-recharts]').length).toBeGreaterThan(0)

    render(
      <ConversationsHeatmapByHourChart
        isLoading={false}
        error={null}
        data={{
          Sunday: { 0: 1 },
          Monday: { 1: 2 },
          Tuesday: {},
          Wednesday: {},
          Thursday: {},
          Friday: {},
          Saturday: {},
        }}
      />,
    )
    expect(screen.getByTestId('heatmap')).toBeInTheDocument()

    // ModelUsageChart: cover grouping into Other + label renderer branches.
    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true })
    render(
      <ModelUsageChart
        isLoading={false}
        error={null}
        data={[
          { model_name: 'A', count: 100, percentage: 99 },
          { model_name: 'Tiny', count: 1, percentage: 0.5 },
        ]}
      />,
    )
    expect(
      screen.getByRole('figure', { name: /Model usage distribution/i }),
    ).toBeInTheDocument()
  })
})
