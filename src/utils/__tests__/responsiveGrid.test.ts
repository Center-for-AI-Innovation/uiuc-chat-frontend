import { describe, expect, it } from 'vitest'
import {
  GRID_CONFIGS,
  getResponsiveCardWidth,
  getResponsiveGridClasses,
  useResponsiveCardWidth,
  useResponsiveGrid,
} from '../responsiveGrid'

describe('responsiveGrid', () => {
  it('builds breakpoint classes for collapsed/expanded sidebar', () => {
    expect(getResponsiveGridClasses(GRID_CONFIGS.STATS_CARDS, false)).toBe(
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
    )
    expect(getResponsiveGridClasses(GRID_CONFIGS.STATS_CARDS, true)).toBe(
      'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4',
    )
  })

  it('hook-style helpers delegate to core functions', () => {
    expect(useResponsiveGrid('CHARTS', true)).toBe(
      getResponsiveGridClasses(GRID_CONFIGS.CHARTS, true),
    )
    expect(useResponsiveCardWidth(false)).toBe(getResponsiveCardWidth(false))
  })

  it('returns the collapsed card width when sidebar is collapsed', () => {
    expect(getResponsiveCardWidth(true)).toBe(
      'w-[96%] md:w-[98%] lg:w-[96%] xl:w-[94%] 2xl:w-[92%]',
    )
  })
})
