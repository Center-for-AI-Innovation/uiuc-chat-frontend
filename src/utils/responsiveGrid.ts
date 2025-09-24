/**
 * Responsive Layout Utility
 *
 * This utility provides grid classes and card widths that adapt to both screen size (Tailwind breakpoints)
 * and sidebar state (collapsed/expanded) for components using SettingsLayout.
 *
 * Available space calculation:
 * - Mobile (< 768px): Full width (sidebar is overlay)
 * - Desktop Expanded (≥ 768px): calc(100vw - 280px) sidebar width
 * - Desktop Collapsed (≥ 768px): calc(100vw - 80px) sidebar width
 */

interface GridConfig {
  /** Number of columns on mobile (< 768px) */
  mobile: number
  /** Number of columns on medium screens (768px-1024px) when sidebar is expanded */
  mdExpanded: number
  /** Number of columns on medium screens (768px-1024px) when sidebar is collapsed */
  mdCollapsed: number
  /** Number of columns on large screens (1024px-1280px) when sidebar is expanded */
  lgExpanded: number
  /** Number of columns on large screens (1024px-1280px) when sidebar is collapsed */
  lgCollapsed: number
  /** Number of columns on extra large screens (≥1280px) when sidebar is expanded */
  xlExpanded: number
  /** Number of columns on extra large screens (≥1280px) when sidebar is collapsed */
  xlCollapsed: number
}

/**
 * Generates responsive grid column classes based on screen size and sidebar state
 *
 * @param config Grid configuration for different breakpoints and sidebar states
 * @param isCollapsed Whether the sidebar is currently collapsed
 * @returns String of Tailwind CSS classes for responsive grid columns
 */
export function getResponsiveGridClasses(
  config: GridConfig,
  isCollapsed: boolean,
): string {
  const classes = []

  // Base mobile (always same regardless of sidebar since it's overlay)
  classes.push(`grid-cols-${config.mobile}`)

  // Medium screens (768px+) - sidebar affects available space
  if (isCollapsed) {
    classes.push(`md:grid-cols-${config.mdCollapsed}`)
  } else {
    classes.push(`md:grid-cols-${config.mdExpanded}`)
  }

  // Large screens (1024px+)
  if (isCollapsed) {
    classes.push(`lg:grid-cols-${config.lgCollapsed}`)
  } else {
    classes.push(`lg:grid-cols-${config.lgExpanded}`)
  }

  // Extra large screens (1280px+)
  if (isCollapsed) {
    classes.push(`xl:grid-cols-${config.xlCollapsed}`)
  } else {
    classes.push(`xl:grid-cols-${config.xlExpanded}`)
  }

  return classes.join(' ')
}

/**
 * Pre-defined grid configurations for common use cases
 */
export const GRID_CONFIGS = {
  /** Standard 3-column grid that adapts to sidebar state */
  STATS_CARDS: {
    mobile: 1,
    mdExpanded: 2, // Less space with expanded sidebar
    mdCollapsed: 3, // More space with collapsed sidebar
    lgExpanded: 3, // Comfortable with expanded sidebar
    lgCollapsed: 4, // More columns with collapsed sidebar
    xlExpanded: 3, // Standard with expanded sidebar
    xlCollapsed: 4, // More columns with collapsed sidebar
  } as GridConfig,

  /** Chart/large content grid */
  CHARTS: {
    mobile: 1,
    mdExpanded: 1, // Full width on medium with expanded sidebar
    mdCollapsed: 2, // 2 columns with collapsed sidebar
    lgExpanded: 2, // 2 columns with expanded sidebar
    lgCollapsed: 2, // 2 columns with collapsed sidebar
    xlExpanded: 2, // 2 columns with expanded sidebar
    xlCollapsed: 3, // 3 columns with collapsed sidebar (more space)
  } as GridConfig,

  /** Small cards/items grid */
  SMALL_CARDS: {
    mobile: 2,
    mdExpanded: 3, // 3 columns with expanded sidebar
    mdCollapsed: 4, // 4 columns with collapsed sidebar
    lgExpanded: 4, // 4 columns with expanded sidebar
    lgCollapsed: 5, // 5 columns with collapsed sidebar
    xlExpanded: 5, // 5 columns with expanded sidebar
    xlCollapsed: 6, // 6 columns with collapsed sidebar
  } as GridConfig,
} as const

/**
 * Hook-style function for React components
 *
 * @param configName Pre-defined config name or custom config
 * @param isCollapsed Whether sidebar is collapsed
 * @returns Grid classes string
 */
export function useResponsiveGrid(
  configName: keyof typeof GRID_CONFIGS | GridConfig,
  isCollapsed: boolean,
): string {
  const config =
    typeof configName === 'string' ? GRID_CONFIGS[configName] : configName
  return getResponsiveGridClasses(config, isCollapsed)
}

/**
 * Get responsive card/container width classes based on sidebar state
 *
 * @param isCollapsed - Whether the sidebar is collapsed
 * @returns Tailwind width classes string
 */
export function getResponsiveCardWidth(isCollapsed: boolean): string {
  return isCollapsed
    ? 'w-[96%] md:w-[98%] lg:w-[96%] xl:w-[94%] 2xl:w-[92%]' // More space when sidebar collapsed
    : 'w-[96%] md:w-[94%] lg:w-[92%] xl:w-[90%] 2xl:w-[88%]' // Less space when sidebar expanded
}

/**
 * Hook for getting responsive card width classes
 *
 * @param isCollapsed - Whether the sidebar is collapsed
 * @returns Tailwind width classes string
 */
export function useResponsiveCardWidth(isCollapsed: boolean): string {
  return getResponsiveCardWidth(isCollapsed)
}
