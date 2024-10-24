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

interface ConversationsPerDayData {
  [date: string]: number
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

  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
}

const ConversationsPerDayChart: React.FC<{ course_name: string }> = ({
  course_name,
}) => {
  const [data, setData] = useState<{ date: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/UIUC-api/getConversationStats?course_name=${course_name}`,
        )
        if (response.status === 200) {
          const conversationsPerDay: ConversationsPerDayData =
            response.data.per_day

          const chartData = Object.keys(conversationsPerDay)
            .sort()
            .map((date) => ({
              date,
              count: conversationsPerDay[date] || 0,
            }))

          setData(chartData)
        } else {
          setError('Failed to fetch data.')
        }
      } catch (err) {
        console.error('Error fetching conversations per day:', err)
        setError('An error occurred while fetching data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [course_name])

  if (isLoading) {
    return <Text>Loading chart...</Text>
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Title order={4} mb="md" style={{ textAlign: 'center' }}>
        {`Conversations Per Day`}
      </Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="date"
            tick={{
              fill: '#fff',
              fontFamily: 'Montserrat',
              fontSize: 15,
              angle: -45,
              dx: -5,
            }}
            label={{
              value: 'Date',
              position: 'insideBottom',
              offset: -5,
              fill: '#fff',
              fontFamily: 'Montserrat',
              dy: 13,
            }}
            tickFormatter={(date) => formatDate(date)}
            tickMargin={10}
            interval={2}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fill: '#fff', fontFamily: 'Montserrat' }}
            label={{
              value: 'Number of Conversations',
              angle: -90,
              position: 'center',
              fill: '#fff',
              fontFamily: 'Montserrat',
              dx: -10,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15162c',
              borderColor: '#3a3a4a',
              color: '#fff',
              fontFamily: 'Montserrat',
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
