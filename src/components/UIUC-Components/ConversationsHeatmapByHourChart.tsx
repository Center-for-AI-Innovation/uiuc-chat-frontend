import React, { useEffect, useState } from 'react'
import { HeatMapGrid } from 'react-grid-heatmap'
import axios from 'axios'
import { Text, Title } from '@mantine/core'

const ConversationsHeatmap: React.FC<{ course_name: string }> = ({
  course_name,
}) => {
  const [data, setData] = useState<number[][]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const hours = Array.from({ length: 24 }, (_, i) => i.toString())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/UIUC-api/getConversationHeatmapByHour?course_name=${course_name}`,
        )
        if (response.status === 200) {
          const heatmapData = response.data

          const formattedData = daysOfWeek.map((day) =>
            hours.map((hour) => heatmapData[day]?.[parseInt(hour)] || 0),
          )

          setData(formattedData)
        } else {
          setError('Failed to fetch heatmap data.')
        }
      } catch (err) {
        console.error('Error fetching heatmap data:', err)
        setError('An error occurred while fetching the data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [course_name])

  if (isLoading) {
    return <Text>Loading heatmap...</Text>
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  return (
    <div style={{ width: '100%', height: 'auto', padding: '20px' }}>
      <Title order={4} mb="md" style={{ textAlign: 'center' }}>
        Conversations Per Day and Hour
      </Title>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <HeatMapGrid
          data={data}
          xLabels={hours}
          yLabels={daysOfWeek}
          cellRender={(x, y, value) => `${value}`}
          xLabelsStyle={(index) => ({
            color: '#fff',
            fontFamily: 'Montserrat',
            fontSize: '12px',
            padding: '0 5px',
          })}
          yLabelsStyle={() => ({
            color: '#fff',
            fontFamily: 'Montserrat',
            fontSize: '12px',
            padding: '0 5px',
          })}
          cellStyle={(_x, _y, ratio) => ({
            background: `rgba(126, 87, 194, ${ratio})`,
            fontSize: '12px',
            color: '#fff',
            border: '1px solid #3a3a4a',
          })}
          square
          cellHeight="40px"
        />
      </div>
    </div>
  )
}

export default ConversationsHeatmap
