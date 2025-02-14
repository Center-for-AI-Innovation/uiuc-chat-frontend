// src/components/UIUC-Components/ConversationsPerDayChart.tsx
import React, { useState, useMemo, useEffect } from 'react'
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
  dateRange: DateRange
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

const generateDateRange = (startDate: Date, endDate: Date) => {
  const dates: { date: string; count: number }[] = []
  const currentDate = new Date(startDate)

  // Loop through each day in the range
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    dates.push({
      date: dateStr,
      count: 0, // Default to 0 conversations
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dates
}

const ensureCompleteDateRange = (
  data: { [date: string]: number } | undefined,
  range: DateRange,
) => {
  if (!data || !range.startDate || !range.endDate) return []

  // Generate full range of dates within the selected period
  const completeDates = generateDateRange(range.startDate, range.endDate)

  // Fill in actual conversation counts where they exist
  completeDates.forEach((dateObj) => {
    if (data[dateObj.date]) {
      dateObj.count = data[dateObj.date]
    }
  })

  return completeDates
}

const ConversationsPerDayChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
  dateRange,
}) => {
  const chartData = useMemo(() => {
    return ensureCompleteDateRange(data, dateRange)
  }, [data, dateRange])

  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, 1]

    const values = chartData.map((item) => item.count)
    const maxValue = Math.max(...values)
    return [0, Math.ceil(maxValue * 1.1)]
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

  const determineInterval = (dataLength: number): number => {
    if (dataLength <= 25) return 0
    if (dataLength <= 40) return 1
    if (dataLength <= 60) return 2
    if (dataLength <= 90) return 3
    return Math.ceil(dataLength / 30)
  }

  const getYAxisLabelPadding = (data: { count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count))
    const digits = maxValue.toString().length
    return -(10 + (digits - 1) * 7)
  }

  return (
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
              fontSize: chartData.length > 5 ? 11 : 14,
              angle: chartData.length > 5 ? -45 : 0,
              textAnchor: chartData.length > 5 ? 'end' : 'middle',
              dx: chartData.length > 5 ? 0 : 0,
              dy: chartData.length > 5 ? 8 : 8,
            }}
            height={60}
            tickFormatter={formatDate}
            interval={determineInterval(chartData.length)}
            label={{
              value: 'Date',
              position: 'insideBottom',
              offset: -10,
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dy: 25,
            }}
          />
          <YAxis
            allowDecimals={false}
            domain={yAxisDomain}
            tick={{
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            label={{
              value: 'Number of Conversations',
              angle: -90,
              position: 'center',
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dx: getYAxisLabelPadding(chartData),
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15162c',
              borderColor: '#3a3a4a',
              color: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            formatter={(value: number) => [`Conversations: ${value}`]}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <Bar dataKey="count" fill="#7e57c2" name="Number of Conversations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(ConversationsPerDayChart)
