export interface ModelUsage {
  model_name: string
  count: number
  percentage: number
}

export interface WeeklyTrend {
  current_week_value: number
  metric_name: string
  percentage_change: number
  previous_week_value: number
}

export interface NomicMapData {
  map_id: string
  map_link: string
}
