// src/components/UIUC-Components/ConversationsPerDayChart.tsx
import React, { useState } from 'react'
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
import { Text, Title } from '@mantine/core'
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

  if (!data) {
    return <Text>No data available</Text>
  }

  const chartData = Object.keys(data)
    .sort()
    .map((date) => ({
      date,
      count: data[date] || 0,
    }))

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
    return -(10 + (digits - 1) * 5) // -10 for 1 digit, -15 for 2 digits, -20 for 3 digits, etc.
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
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
            formatter={(value) => [`Conversations: ${value}`]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar dataKey="count" fill="#7e57c2" name="Number of Conversations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversationsPerDayChart
