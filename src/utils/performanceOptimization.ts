/**
 * 性能优化工具模块
 *
 * 提供各种性能优化相关的工具函数和缓存管理
 */

// 歌单歌曲数量缓存清理
let songCountCacheClearer: (() => void) | null = null

export const registerSongCountCacheClearer = (clearer: () => void) => {
  songCountCacheClearer = clearer
}

export const clearSongCountCache = () => {
  if (songCountCacheClearer) {
    songCountCacheClearer()
  }
}

// 性能监控工具
export class PerformanceMonitor {
  private static readonly marks = new Map<string, number>()

  static mark(name: string) {
    this.marks.set(name, Date.now())
  }

  static measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark)
    if (!start) {
      console.warn(`Performance mark "${startMark}" not found`)
      return 0
    }

    const duration = Date.now() - start
    console.log(`[Performance] ${name}: ${duration}ms`)
    return duration
  }

  static clear() {
    this.marks.clear()
  }
}

// 防抖函数
export function debounce<T extends(...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function(this: any, ...args: Parameters<T>) {
    const context = this

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func.apply(context, args)
      timeout = null
    }, wait)
  }
}

// 节流函数
export function throttle<T extends(...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let lastRun = 0

  return function(this: any, ...args: Parameters<T>) {
    const context = this
    const now = Date.now()

    if (now - lastRun >= wait) {
      func.apply(context, args)
      lastRun = now
    } else if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(context, args)
        lastRun = Date.now()
        timeout = null
      }, wait - (now - lastRun))
    }
  }
}

// 批量更新调度器
export class BatchUpdateScheduler {
  private timer: NodeJS.Timeout | null = null
  private readonly callbacks = new Set<() => void>()
  private readonly delay: number

  constructor(delay: number = 100) {
    this.delay = delay
  }

  schedule(callback: () => void) {
    this.callbacks.add(callback)

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush()
      }, this.delay)
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    for (const callback of this.callbacks) {
      try {
        callback()
      } catch (error) {
        console.error('Batch update callback error:', error)
      }
    }

    this.callbacks.clear()
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.callbacks.clear()
  }
}
