// src/components/UIUC-Components/ConversationsHeatmapByHourChart.tsx
import React, { useMemo } from 'react'
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
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => i.toString()),
    [],
  )

  const { formattedData, maxValue } = useMemo(() => {
    if (!data) return { formattedData: [], maxValue: 0 }

    const grid = daysOfWeek.map((day) =>
      hours.map((hour) => data[day]?.[parseInt(hour)] || 0),
    )

    const max = Math.max(...grid.flat(), 1)

    return { formattedData: grid, maxValue: max }
  }, [data, daysOfWeek, hours])

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

  const getCellColor = (value: number) => {
    const ratio = value / maxValue
    return `color-mix(in srgb, var(--dashboard-stat), transparent ${100 - ratio * 100}%)`
  }

  const getTextColor = (value: number) => {
    const ratio = value / maxValue
    return `color-mix(in srgb, var(--dashboard-button-foreground), var(--foreground) ${ratio < 0.5 ? 100 : 0}%)`
  }

  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <table
        aria-label="Conversations by day and hour heatmap"
        style={{
          borderCollapse: 'collapse',
          fontFamily: montserrat_paragraph.style.fontFamily,
        }}
      >
        <thead>
          <tr>
            <th scope="col" style={{ padding: '0 5px' }}>
              <span className="sr-only">Day of week</span>
            </th>
            {hours.map((hour) => (
              <th
                key={hour}
                scope="col"
                style={{
                  fontSize: '.75rem',
                  padding: '4px 2px',
                  textAlign: 'center',
                  fontWeight: 'normal',
                }}
              >
                {hour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daysOfWeek.map((day, dayIndex) => (
            <tr key={day}>
              <th
                scope="row"
                style={{
                  fontSize: '.75rem',
                  padding: '0 5px 0 0',
                  textAlign: 'right',
                  fontWeight: 'normal',
                  whiteSpace: 'nowrap',
                }}
              >
                {day}
              </th>
              {formattedData[dayIndex]?.map((value, hourIndex) => (
                <td
                  key={hourIndex}
                  style={{
                    fontSize: '.65rem',
                    textAlign: 'center',
                    height: '40px',
                    minWidth: '30px',
                    background: getCellColor(value),
                    color: getTextColor(value),
                    border: '1px solid var(--foreground-faded)',
                  }}
                  aria-label={`${day} at ${hours[hourIndex]}:00: ${value} conversations`}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ConversationsHeatmapByHourChart
