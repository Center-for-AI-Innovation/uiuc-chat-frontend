// src/components/UIUC-Components/ConversationsPerDayChart.tsx
import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import axios from 'axios'
import { Text, Title, Switch } from '@mantine/core'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_paragraph } from 'fonts'

interface ChartProps {
  data?: { [date: string]: number }
  isLoading: boolean
  error: string | null
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date'

  const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  if (!isValidDateFormat) {
    console.error('Unexpected date format:', dateString)
    return 'Invalid Date'
  }

  const dateParts = dateString.split('-')
  const year = Number(dateParts[0])
  const month = Number(dateParts[1]) - 1
  const day = Number(dateParts[2])

  const date = new Date(year, month, day)

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString)
    return 'Invalid Date'
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const ConversationsPerDayChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const [useLogScale, setUseLogScale] = useState(false)

  const getCustomTicks = useMemo(
    () =>
      (min: number, max: number): number[] => {
        if (!useLogScale) return []

        const ticks: number[] = []
        let tick = 1
        while (tick <= max) {
          if (tick >= min) ticks.push(tick)
          if (tick === 1) tick = 2
          else if (tick === 2) tick = 5
          else if (tick === 5) tick = 10
          else if (tick.toString().startsWith('1')) tick *= 2
          else if (tick.toString().startsWith('2')) tick = tick * 2.5
          else tick *= 2
        }
        return ticks
      },
    [useLogScale],
  )

  const chartData = useMemo(
    () =>
      Object.keys(data || {})
        .sort()
        .map((date) => ({
          date,
          count: data?.[date] || 0,
        })),
    [data],
  )

  const { maxValue, minValue } = useMemo(() => {
    const values = chartData.map((item) => item.count)
    return {
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
    }
  }, [chartData])

  if (isLoading) {
    return (
      <Text>
        Loading chart <LoadingSpinner size="xs" />
      </Text>
    )
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  if (!data || Object.keys(data).length === 0) {
    return <Text>No data available</Text>
  }

  const yAxisDomain = useLogScale
    ? [Math.max(1, minValue), Math.ceil(maxValue * 1.1)]
    : [0, Math.ceil(maxValue * 1.1)]

  const determineInterval = (dataLength: number): number => {
    if (dataLength <= 25) return 0
    if (dataLength <= 40) return 1
    if (dataLength <= 60) return 2
    if (dataLength <= 90) return 3
    return Math.ceil(dataLength / 30)
  }

  const xAxisInterval = determineInterval(chartData.length)

  const getYAxisLabelPadding = (data: { count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count))
    const digits = maxValue.toString().length
    return -(10 + (digits - 1) * 7)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Text size="sm" color="dimmed">
          Linear
        </Text>
        <Switch
          checked={useLogScale}
          onChange={(event) => setUseLogScale(event.currentTarget.checked)}
          size="sm"
          color="violet"
          aria-label="Toggle between linear and logarithmic scale"
          title="Switch between linear and logarithmic scale visualization"
        />
        <Text size="sm" color="dimmed">
          Logarithmic
        </Text>
      </div>

      <div
        style={{ width: '100%', height: 400 }}
        role="region"
        aria-label="Conversations per day visualization"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
            <XAxis
              dataKey="date"
              tick={{
                fill: '#fff',
                fontFamily: montserrat_paragraph.style.fontFamily,
                fontSize: chartData.length > 30 ? 12 : 15,
                dx: chartData.length > 30 ? -3 : -5,
                dy: 8,
              }}
              angle={chartData.length > 15 ? -45 : 0}
              label={{
                value: 'Date',
                position: 'insideBottom',
                offset: -20,
                fill: '#fff',
                fontFamily: montserrat_paragraph.style.fontFamily,
                dy: 25,
              }}
              tickFormatter={formatDate}
              tickMargin={chartData.length > 30 ? 15 : 25}
              interval={xAxisInterval}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fill: '#fff',
                fontFamily: montserrat_paragraph.style.fontFamily,
              }}
              label={{
                value: useLogScale
                  ? 'Number of Conversations (log scale)'
                  : 'Number of Conversations',
                angle: -90,
                position: 'center',
                fill: '#fff',
                fontFamily: montserrat_paragraph.style.fontFamily,
                dx: getYAxisLabelPadding(chartData),
              }}
              scale={useLogScale ? 'log' : 'linear'}
              domain={yAxisDomain}
              ticks={
                useLogScale ? getCustomTicks(minValue, maxValue) : undefined
              }
              tickFormatter={(value) => Math.round(value).toString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#15162c',
                borderColor: '#3a3a4a',
                color: '#fff',
                fontFamily: montserrat_paragraph.style.fontFamily,
              }}
              formatter={(value: number) => [`Conversations: ${value}`]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar
              dataKey="count"
              fill="#7e57c2"
              name="Number of Conversations"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default React.memo(ConversationsPerDayChart)
