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

const ConversationsPerDayOfWeekChart: React.FC<{ course_name: string }> = ({
  course_name,
}) => {
  const [data, setData] = useState<{ day: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/UIUC-api/getConversationStats?course_name=${course_name}`,
        )
        if (response.status === 200) {
          const conversationsPerDayOfWeek = response.data.per_weekday

          const daysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ]

          const chartData = daysOfWeek.map((day) => ({
            day,
            count: conversationsPerDayOfWeek[day] || 0,
          }))

          setData(chartData)
        } else {
          setError('Failed to fetch data.')
        }
      } catch (err) {
        console.error('Error fetching conversations per day of week:', err)
        setError('An error occurred while fetching data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [course_name])

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

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="day"
            tick={{
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            label={{
              value: 'Day of Week',
              position: 'insideBottom',
              offset: -5,
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dy: 5,
            }}
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
              dx: -10,
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
            labelFormatter={(label) => `Day of Week: ${label}`}
          />
          <Bar dataKey="count" fill="#7e57c2" name="Number of Conversations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversationsPerDayOfWeekChart
