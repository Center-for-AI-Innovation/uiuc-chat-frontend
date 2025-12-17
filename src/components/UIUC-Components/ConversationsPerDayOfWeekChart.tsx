// src/components/UIUC-Components/ConversationsPerDayOfWeekChart.tsx
import React, { useEffect, useState } from 'react'
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
import { useTranslation } from 'next-i18next'

interface ChartProps {
  data?: { [day: string]: number }
  isLoading: boolean
  error: string | null
}

const ConversationsPerDayOfWeekChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const { t } = useTranslation('common')
  const daysOfWeek = [
    t('analysis.sunday', 'Sunday') || 'Sunday',
    t('analysis.monday', 'Monday') || 'Monday',
    t('analysis.tuesday', 'Tuesday') || 'Tuesday',
    t('analysis.wednesday', 'Wednesday') || 'Wednesday',
    t('analysis.thursday', 'Thursday') || 'Thursday',
    t('analysis.friday', 'Friday') || 'Friday',
    t('analysis.saturday', 'Saturday') || 'Saturday',
  ]

  const getYAxisLabelPadding = (data: { count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count))
    const digits = maxValue.toString().length
    return -(10 + (digits - 1) * 5)
  }

  if (isLoading) {
    return (
      <Text>
        {t('analysis.loadingChart', 'Loading chart')} <LoadingSpinner size="xs" />
      </Text>
    )
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  if (!data) {
    return <Text>{t('analysis.noDataAvailable', 'No data available')}</Text>
  }

  const chartData = daysOfWeek.map((day) => ({
    day,
    count: data[day] || 0,
  }))

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="day"
            tick={{
              fontFamily: montserrat_paragraph.style.fontFamily,
              fontSize: '.75rem',
            }}
            label={{
              value: t('analysis.dayOfWeek', 'Day of Week'),
              position: 'insideBottom',
              offset: -5,
              fill: 'var(--foreground)',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dy: 5,
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={{
              fontFamily: montserrat_paragraph.style.fontFamily,
              fontSize: '.75rem',
            }}
            label={{
              value: t('analysis.numberOfConversations', 'Number of Conversations'),
              angle: -90,
              position: 'center',
              fill: 'var(--foreground)',
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
            formatter={(value) => {
              const num = typeof value === 'number' ? value : Number(value);
              return String(t('analysis.conversationsCount', { count: num, defaultValue: `Conversations: ${num}` }));
            }}
            labelFormatter={(label) => t('analysis.dayOfWeekLabel', { day: label, defaultValue: 'Day of Week: {{day}}' })}
          />
          <Bar
            dataKey="count"
            fill="var(--dashboard-stat)"
            name={t('analysis.numberOfConversations') as unknown as string}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversationsPerDayOfWeekChart
