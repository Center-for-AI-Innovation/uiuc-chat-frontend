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

const ConversationsPerHourChart: React.FC<{ course_name: string }> = ({
  course_name,
}) => {
  const [data, setData] = useState<{ hour: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const ensureAllHours = (data: { [hour: string]: number }) => {
    const fullHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i.toString(),
      count: data[i] || 0,
    }))
    return fullHours
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/UIUC-api/getConversationStats?course_name=${course_name}`,
        )
        if (response.status === 200) {
          const { per_hour } = response.data
          const chartData = ensureAllHours(per_hour)
          setData(chartData)
        } else {
          setError('Failed to fetch data.')
        }
      } catch (err) {
        console.error('Error fetching conversations per hour:', err)
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
        {`Conversations Per Hour`}
      </Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#fff', fontFamily: 'Montserrat' }}
            label={{
              value: 'Hour',
              position: 'insideBottom',
              offset: -5,
              fill: '#fff',
              fontFamily: 'Montserrat',
              dy: 5,
            }}
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
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Bar dataKey="count" fill="#7e57c2" name="Number of Conversations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversationsPerHourChart
