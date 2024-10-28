import React, { useEffect, useState, useRef, useMemo } from 'react'
import { HeatMapGrid } from 'react-grid-heatmap'
import axios from 'axios'
import { Text } from '@mantine/core'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_paragraph } from 'fonts'

const ConversationsHeatmap: React.FC<{ course_name: string }> = ({
  course_name,
}) => {
  const [data, setData] = useState<number[][]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const daysOfWeek = useMemo(
    () => [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    [],
  )
  const hours = Array.from({ length: 24 }, (_, i) => i.toString())

  // Fetch heatmap data
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
  }, [course_name, daysOfWeek, hours])

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    // Initial width
    updateWidth()

    // Add resize listener
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculate dynamic cell width
  const numColumns = hours.length
  const padding = 40 // Adjust based on your layout (e.g., padding/margins)
  const availableWidth = containerWidth - padding
  const cellWidth = availableWidth / numColumns

  // Set minimum and maximum cell widths for better responsiveness
  const minCellWidth = 30
  const maxCellWidth = 60
  const finalCellWidth = Math.max(
    minCellWidth,
    Math.min(cellWidth, maxCellWidth),
  )

  // Optional: Adjust font size based on cell width for better readability
  const fontSize = Math.max(10, Math.min(finalCellWidth / 3, 14)) // Example logic

  if (isLoading) {
    return (
      <Text>
        Loading heatmap <LoadingSpinner size="xs" />
      </Text>
    )
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <HeatMapGrid
          data={data}
          xLabels={hours}
          yLabels={daysOfWeek}
          cellRender={(x, y, value) => `${value}`}
          xLabelsStyle={() => ({
            color: '#fff',
            fontFamily: montserrat_paragraph.style.fontFamily,
            padding: '0 2px',
            textAlign: 'center',
          })}
          yLabelsStyle={() => ({
            color: '#fff',
            fontFamily: montserrat_paragraph.style.fontFamily,
            padding: '0 5px',
            textAlign: 'right',
            lineHeight: `${40}px`, // Match the fixed cellHeight
          })}
          cellStyle={(_x, _y, ratio) => ({
            background: `rgba(126, 87, 194, ${ratio})`,
            color: '#fff',
            border: '1px solid #3a3a4a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          })}
          square={false}
          cellHeight="40px" // Fixed height
        />
      </div>
    </div>
  )
}

export default ConversationsHeatmap
