import React from 'react'
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

const ModelUsageChart: React.FC<ModelUsageChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  if (isLoading) return <LoadingSpinner />
  if (error) return <Text color="red">{error}</Text>
  if (!data || data.length === 0)
    return <Text>No model usage data available</Text>

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

  const finalData = [
    ...groupedData.main,
    ...(groupedData.other.count > 0 ? [groupedData.other] : []),
  ]

  const chartData = finalData.map((item) => ({
    name: item.model_name,
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }))

  // Custom label renderer with improved positioning
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = outerRadius * 1.2
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // Only show label if percentage is >= 3%
    if (percent < 0.03) return null

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 500 }}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    )
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderCustomizedLabel}
            outerRadius={120}
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
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{
              fontSize: '14px',
              paddingLeft: '20px',
            }}
            formatter={(value: string) => {
              const item = chartData.find((d) => d.name === value)
              return [`${value} (${item?.percentage}%)`]
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ModelUsageChart
