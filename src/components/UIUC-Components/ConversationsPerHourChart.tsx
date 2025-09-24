import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import axios from 'axios'
import { Text, Title } from '@mantine/core'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_paragraph } from 'fonts'
import { useTranslation } from 'next-i18next'

interface ChartProps {
  data?: { [hour: string]: number }
  isLoading: boolean
  error: string | null
}

const ConversationsPerHourChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const { t } = useTranslation('common')
  const ensureAllHours = (hourData: { [hour: string]: number } | undefined) => {
    const fullHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i.toString(),
      count: hourData?.[i] || 0,
    }))
    return fullHours
  }

  const getYAxisLabelPadding = (data: { count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count))
    const digits = maxValue.toString().length
    return -(10 + (digits - 1) * 5)
  }

  if (isLoading) {
    return (
      <Text>
        {t('analysis.loadingChart')} <LoadingSpinner size="xs" />
      </Text>
    )
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  if (!data) {
    return <Text>{t('analysis.noDataAvailable')}</Text>
  }

  const chartData = ensureAllHours(data)

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="hour"
            tick={{
              fontFamily: montserrat_paragraph.style.fontFamily,
              fontSize: '.75rem',
            }}
            label={{
              value: t('analysis.hour') as unknown as string,
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
              value: t('analysis.numberOfConversations') as unknown as string,
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
              const numeric = typeof value === 'number' ? value : Number(value)
              return [
                t('analysis.conversationsCount', { count: numeric }) as unknown as string,
                t('analysis.numberOfConversations') as unknown as string,
              ]
            }}
            labelFormatter={(label) =>
              t('analysis.hourLabel', { hour: label }) as unknown as string
            }
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

export default ConversationsPerHourChart
