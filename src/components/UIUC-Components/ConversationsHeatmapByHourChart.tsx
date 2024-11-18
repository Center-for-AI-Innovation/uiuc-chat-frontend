// src/components/UIUC-Components/ConversationsHeatmapByHourChart.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { HeatMapGrid } from 'react-grid-heatmap'
import axios from 'axios'
import { Text } from '@mantine/core'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_paragraph } from 'fonts'

interface ChartProps {
  data?: { [day: string]: { [hour: string]: number } }
  isLoading: boolean
  error: string | null
}

const ConversationsHeatmapByHourChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
}) => {
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

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

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

  if (!data) {
    return <Text>No data available</Text>
  }

  const formattedData = daysOfWeek.map((day) =>
    hours.map((hour) => data[day]?.[parseInt(hour)] || 0),
  )

  const numColumns = hours.length
  const padding = 40
  const availableWidth = containerWidth - padding
  const cellWidth = availableWidth / numColumns

  const minCellWidth = 30
  const maxCellWidth = 60
  const finalCellWidth = Math.max(
    minCellWidth,
    Math.min(cellWidth, maxCellWidth),
  )

  const fontSize = Math.max(10, Math.min(finalCellWidth / 3, 14))

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
          data={formattedData}
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

export default ConversationsHeatmapByHourChart
