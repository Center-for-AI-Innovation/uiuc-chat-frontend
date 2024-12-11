import React, { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { LoadingSpinner } from './LoadingSpinner'
import { Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface ModelUsage {
  model_name: string
  count: number
  percentage: number
}

interface ModelUsageChartProps {
  data: ModelUsage[] | null
  isLoading: boolean
  error: string | null
}

// ColorBrewer palette (colorblind-friendly)
const COLORS = [
  '#1f77b4', // blue
  '#2ca02c', // green
  '#ff7f0e', // orange
  '#9467bd', // purple
  '#8c564b', // brown
  '#7f7f7f', // gray
]

// Add color contrast utility
const getContrastColor = (hexColor: string): string => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

const ModelUsageChart: React.FC<ModelUsageChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Memoize data processing
  const { chartData, finalData } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], finalData: [] }

    // Group models with less than 1% usage into "Other"
    const threshold = 1
    const groupedData = data.reduce(
      (acc, item) => {
        if (item.percentage >= threshold) {
          acc.main.push(item)
        } else {
          acc.other.count += item.count
          acc.other.percentage += item.percentage
        }
        return acc
      },
      {
        main: [] as ModelUsage[],
        other: { model_name: 'Other', count: 0, percentage: 0 } as ModelUsage,
      },
    )

    // Sort main data by percentage in descending order
    groupedData.main.sort((a, b) => b.percentage - a.percentage)

    const finalData = [
      ...groupedData.main,
      ...(groupedData.other.count > 0 ? [groupedData.other] : []),
    ]

    const chartData = finalData.map((item) => ({
      name: item.model_name,
      value: item.count,
      percentage: item.percentage.toFixed(1),
    }))

    return { chartData, finalData }
  }, [data])

  // Now we can have conditional returns
  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4" role="alert">
        <div className="flex items-center gap-2">
          <IconAlertCircle className="text-red-400" size={20} />
          <Text color="red">Error loading model usage data: {error}</Text>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner />
        <Text>Loading model usage data...</Text>
      </div>
    )
  }

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800/50 p-4">
        <Text align="center">No model usage data available</Text>
      </div>
    )
  }

  // Custom label renderer with improved accessibility
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
    fill,
  }: any) => {
    const RADIAN = Math.PI / 180
    const minPercentage = windowWidth < 768 ? 0.08 : 0.02

    if (percent < minPercentage) return null

    const radius = windowWidth < 768 ? outerRadius * 1.1 : outerRadius * 1.2
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const textAnchor = x > cx ? 'start' : 'end'

    const maxLength = windowWidth < 768 ? 8 : 15
    const truncatedName =
      name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name

    const labelText =
      windowWidth < 768 && percent < 0.15
        ? `${(percent * 100).toFixed(1)}%`
        : `${truncatedName} (${(percent * 100).toFixed(1)}%)`

    const contrastColor = getContrastColor(fill)

    return (
      <g>
        <text
          x={x}
          y={y}
          fill={contrastColor}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          style={{
            fontSize: windowWidth < 768 ? '10px' : '12px',
            fontWeight: 500,
          }}
          aria-label={`${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {labelText}
        </text>
        <path
          d={`M${cx + (outerRadius + 2) * Math.cos(-midAngle * RADIAN)},${
            cy + (outerRadius + 2) * Math.sin(-midAngle * RADIAN)
          }L${x - (textAnchor === 'start' ? 5 : -5)},${y}`}
          stroke={contrastColor}
          fill="none"
          strokeWidth={1}
          opacity={0.5}
        />
      </g>
    )
  }

  return (
    <div
      style={{ width: '100%', height: windowWidth < 768 ? 300 : 400 }}
      role="figure"
      aria-label="Model usage distribution pie chart"
    >
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={windowWidth < 768 ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#15162c"
                strokeWidth={2}
                role="graphics-symbol"
                aria-label={`${entry.name}: ${entry.percentage}%`}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value.toLocaleString()} (${props.payload.percentage}%)`,
              name,
            ]}
            contentStyle={{
              backgroundColor: 'rgba(22, 22, 34, 0.9)',
              border: '1px solid #333',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }}
            wrapperStyle={{ outline: 'none' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            aria-label="Model usage details"
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{
              fontSize: windowWidth < 768 ? '10px' : '12px',
              paddingLeft: windowWidth < 768 ? '10px' : '20px',
              maxWidth: windowWidth < 768 ? '45%' : '35%',
            }}
            formatter={(value: string, entry: any) => {
              const item = chartData.find((d) => d.name === value)
              const maxLength = windowWidth < 768 ? 10 : 15
              const truncatedName =
                value.length > maxLength
                  ? value.substring(0, maxLength - 3) + '...'
                  : value
              return [
                <span
                  key={value}
                  role="text"
                  aria-label={`${value}: ${item?.percentage}%`}
                >
                  {`${truncatedName} (${item?.percentage}%)`}
                </span>,
              ]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(ModelUsageChart)
