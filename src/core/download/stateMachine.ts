/**
 * Download State Machine
 *
 * Manages state transitions for download tasks following a finite state machine pattern.
 *
 * State Transitions:
 * Pending -> Preparing -> Downloading -> Completed
 *                      -> Paused -> Downloading
 *                      -> Error
 */

// Re-export enums from types for convenience
export const DownloadStatus = {
  Pending: 'pending' as const,
  Preparing: 'preparing' as const,
  Downloading: 'downloading' as const,
  Paused: 'paused' as const,
  Completed: 'completed' as const,
  Error: 'error' as const,
}

export type DownloadStatusType = typeof DownloadStatus[keyof typeof DownloadStatus]

export const DownloadFailReason = {
  NoWritePermission: 'no-write-permission' as const,
  FailToFetchSource: 'fail-to-fetch-source' as const,
  NetworkError: 'network-error' as const,
  Unknown: 'unknown' as const,
}

export type DownloadFailReasonType = typeof DownloadFailReason[keyof typeof DownloadFailReason]

/**
 * State transition rules
 * Defines which state transitions are valid
 */
const validTransitions: Record<DownloadStatusType, DownloadStatusType[]> = {
  [DownloadStatus.Pending]: [DownloadStatus.Preparing, DownloadStatus.Error],
  [DownloadStatus.Preparing]: [DownloadStatus.Downloading, DownloadStatus.Error],
  [DownloadStatus.Downloading]: [DownloadStatus.Paused, DownloadStatus.Completed, DownloadStatus.Error],
  [DownloadStatus.Paused]: [DownloadStatus.Pending, DownloadStatus.Error],
  [DownloadStatus.Completed]: [], // Terminal state
  [DownloadStatus.Error]: [DownloadStatus.Pending], // Can retry
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: DownloadStatusType, to: DownloadStatusType): boolean {
  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: DownloadStatusType, errorReason?: DownloadFailReasonType): string {
  switch (status) {
    case DownloadStatus.Pending:
      return '等待中...'
    case DownloadStatus.Preparing:
      return '准备下载...'
    case DownloadStatus.Downloading:
      return '下载中...'
    case DownloadStatus.Paused:
      return '已暂停'
    case DownloadStatus.Completed:
      return '下载完成'
    case DownloadStatus.Error:
      return getErrorText(errorReason)
    default:
      return '未知状态'
  }
}

/**
 * Get human-readable error text
 */
export function getErrorText(reason?: DownloadFailReasonType): string {
  if (!reason) return '下载失败'

  switch (reason) {
    case DownloadFailReason.NoWritePermission:
      return '无写入权限'
    case DownloadFailReason.FailToFetchSource:
      return '获取下载链接失败'
    case DownloadFailReason.NetworkError:
      return '网络错误'
    case DownloadFailReason.Unknown:
      return '下载失败'
    default:
      return '下载失败'
  }
}

/**
 * Convert new status to legacy status for backward compatibility
 */
export function toLegacyStatus(status: DownloadStatusType): LX.Download.DownloadTaskStatus {
  switch (status) {
    case DownloadStatus.Pending:
      return 'waiting'
    case DownloadStatus.Preparing:
      return 'waiting'
    case DownloadStatus.Downloading:
      return 'run'
    case DownloadStatus.Paused:
      return 'pause'
    case DownloadStatus.Completed:
      return 'completed'
    case DownloadStatus.Error:
      return 'error'
    default:
      return 'waiting'
  }
}

/**
 * Convert legacy status to new status
 */
export function fromLegacyStatus(status: LX.Download.DownloadTaskStatus): DownloadStatusType {
  switch (status) {
    case 'waiting':
      return DownloadStatus.Pending
    case 'run':
      return DownloadStatus.Downloading
    case 'pause':
      return DownloadStatus.Paused
    case 'completed':
      return DownloadStatus.Completed
    case 'error':
      return DownloadStatus.Error
    default:
      return DownloadStatus.Pending
  }
}

/**
 * Check if a status is a terminal state (no further transitions)
 */
export function isTerminalState(status: DownloadStatusType): boolean {
  return status === DownloadStatus.Completed
}

/**
 * Check if a status is an active downloading state
 */
export function isActiveState(status: DownloadStatusType): boolean {
  return status === DownloadStatus.Downloading || status === DownloadStatus.Preparing
}

/**
 * Check if a status allows retry
 */
export function canRetry(status: DownloadStatusType): boolean {
  return status === DownloadStatus.Error
}

/**
 * Check if a status allows pause
 */
export function canPause(status: DownloadStatusType): boolean {
  return status === DownloadStatus.Downloading || status === DownloadStatus.Preparing || status === DownloadStatus.Pending
}

/**
 * Check if a status allows resume
 */
export function canResume(status: DownloadStatusType): boolean {
  return status === DownloadStatus.Paused
}

/**
 * Check if a status allows removal
 */
export function canRemove(status: DownloadStatusType): boolean {
  return status !== DownloadStatus.Completed
}
