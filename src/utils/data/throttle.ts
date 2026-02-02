export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): T {
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number | undefined

  return ((...args) => {
    if (lastRan === undefined) {
      func(...args)
      lastRan = Date.now()
    } else {
      const lastRanAtSchedule = lastRan
      clearTimeout(lastFunc)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRanAtSchedule >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRanAtSchedule),
      )
    }
  }) as T
}
