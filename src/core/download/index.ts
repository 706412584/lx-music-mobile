import { downloadFile, stopDownload, existsFile, mkdir } from '@/utils/fs'
import { getMusicUrl } from '@/core/music'
import settingState from '@/store/setting/state'
import { downloadAction } from '@/store/download'
import {
  DownloadStatus,
  DownloadFailReason,
  type DownloadStatusType,
  type DownloadFailReasonType,
  isValidTransition,
  getStatusText,
  toLegacyStatus,
  canPause,
  canResume,
  canRetry,
} from './stateMachine'

// 生成随机 ID（React Native 兼容）
const generateId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 12)
  return `${timestamp}${randomStr}`
}

// 下载任务信息
interface DownloadTaskInfo {
  jobId?: number
  musicInfo: LX.Music.MusicInfoOnline
  quality: LX.Quality
  item: LX.Download.ListItem
  downloadStatus: DownloadStatusType
  errorReason?: DownloadFailReasonType
  lastProgressUpdate?: number // 上次进度更新时间
  retryCount: number // 重试次数
  lastRetryTime?: number // 上次重试时间
  downloadStartTime?: number // 下载开始时间
  lastError?: Error // 最后一次错误
}

// 进度更新节流间隔（毫秒）
const PROGRESS_UPDATE_THROTTLE = 500

// 重试配置
const MAX_RETRY_ATTEMPTS = 3 // 最大重试次数
const RETRY_DELAY_BASE = 2000 // 基础重试延迟（毫秒）
const RETRY_DELAY_MAX = 30000 // 最大重试延迟（毫秒）
const DOWNLOAD_TIMEOUT = 300000 // 下载超时时间（5分钟）
const STALLED_TIMEOUT = 60000 // 下载停滞超时（1分钟无进度更新）

// 批量进度更新队列
const progressUpdateQueue = new Map<string, LX.Download.ProgressInfo>()
let progressUpdateTimer: NodeJS.Timeout | null = null

// 批量处理进度更新，减少状态更新频率
const flushProgressUpdates = () => {
  if (progressUpdateQueue.size === 0) return

  // 批量更新所有待处理的进度
  for (const [id, progress] of progressUpdateQueue.entries()) {
    downloadAction.updateProgress(id, progress)
  }

  progressUpdateQueue.clear()
}

// 调度进度更新
const scheduleProgressUpdate = (id: string, progress: LX.Download.ProgressInfo) => {
  progressUpdateQueue.set(id, progress)

  if (!progressUpdateTimer) {
    progressUpdateTimer = setTimeout(() => {
      flushProgressUpdates()
      progressUpdateTimer = null
    }, 100) // 每100ms批量更新一次
  }
}

// 下载队列和任务管理
const downloadQueue: string[] = [] // 存储待下载的任务ID
const downloadTasks = new Map<string, DownloadTaskInfo>()
let downloadingCount = 0

// 超时检查定时器
const timeoutCheckers = new Map<string, NodeJS.Timeout>()

// 获取最大并发下载数
const getMaxDownloadCount = (): number => {
  const maxDownload = settingState.setting['download.maxDownload']
  const downloadCount = typeof maxDownload === 'number' ? maxDownload : 3
  return Math.max(1, Math.min(downloadCount, 10))
}

// 计算重试延迟（指数退避）
const calculateRetryDelay = (retryCount: number): number => {
  const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount)
  return Math.min(delay, RETRY_DELAY_MAX)
}

// 检查是否应该自动重试
const shouldAutoRetry = (task: DownloadTaskInfo, errorReason: DownloadFailReasonType): boolean => {
  // 超过最大重试次数
  if (task.retryCount >= MAX_RETRY_ATTEMPTS) {
    return false
  }

  // 某些错误类型不应该自动重试
  if (errorReason === DownloadFailReason.NoWritePermission) {
    return false // 权限问题需要用户手动解决
  }

  return true
}

// 清理超时检查器
const clearTimeoutChecker = (id: string) => {
  const checker = timeoutCheckers.get(id)
  if (checker) {
    clearTimeout(checker)
    timeoutCheckers.delete(id)
  }
}

// 设置下载超时检查
const setupTimeoutChecker = (id: string, task: DownloadTaskInfo) => {
  // 清理旧的检查器
  clearTimeoutChecker(id)

  // 设置新的检查器
  const checker = setTimeout(() => {
    const currentTask = downloadTasks.get(id)
    if (!currentTask || currentTask.downloadStatus !== DownloadStatus.Downloading) {
      return
    }

    // 检查是否停滞（长时间无进度更新）
    const now = Date.now()
    const lastUpdate = currentTask.lastProgressUpdate ?? currentTask.downloadStartTime ?? now
    const timeSinceLastUpdate = now - lastUpdate

    if (timeSinceLastUpdate > STALLED_TIMEOUT) {
      console.warn(`Download stalled for task ${id}, triggering timeout`)
      handleDownloadError(id, new Error('Download stalled: No progress for 60 seconds'), DownloadFailReason.NetworkError).catch((err) => {
        console.error('Error handling download timeout:', err)
      })
    }
  }, DOWNLOAD_TIMEOUT)

  timeoutCheckers.set(id, checker)
}

// 统一的错误处理函数
const handleDownloadError = async(
  id: string,
  error: Error,
  errorReason?: DownloadFailReasonType,
) => {
  const task = downloadTasks.get(id)
  if (!task) return

  // 清理超时检查器
  clearTimeoutChecker(id)

  // 保存错误信息
  task.lastError = error

  // 确定错误原因
  let finalErrorReason = errorReason
  if (!finalErrorReason) {
    finalErrorReason = categorizeError(error)
  }

  console.error(`Download error for task ${id}:`, error.message, `Reason: ${finalErrorReason}`)

  // 检查是否应该自动重试
  if (shouldAutoRetry(task, finalErrorReason)) {
    task.retryCount++
    const retryDelay = calculateRetryDelay(task.retryCount - 1)

    console.log(`Auto-retrying task ${id} (attempt ${task.retryCount}/${MAX_RETRY_ATTEMPTS}) after ${retryDelay}ms`)

    // 更新状态为准备重试
    transitionTaskState(task, DownloadStatus.Error, finalErrorReason)
    task.item.statusText = `${getStatusText(DownloadStatus.Error, finalErrorReason)} (${task.retryCount}/${MAX_RETRY_ATTEMPTS}次重试后)`

    // 延迟后自动重试
    task.lastRetryTime = Date.now()
    setTimeout(() => {
      retryDownloadInternal(id).catch((err) => {
        console.error('Auto-retry failed:', err)
      })
    }, retryDelay)
  } else {
    // 不再重试，标记为最终失败
    transitionTaskState(task, DownloadStatus.Error, finalErrorReason)

    if (task.retryCount >= MAX_RETRY_ATTEMPTS) {
      task.item.statusText = `${getStatusText(DownloadStatus.Error, finalErrorReason)} (已达最大重试次数)`
    }

    downloadingCount--
    downloadTasks.delete(id)

    // 从队列中移除
    const queueIndex = downloadQueue.indexOf(id)
    if (queueIndex >= 0) {
      downloadQueue.splice(queueIndex, 1)
    }

    // 继续处理下一个任务
    downloadNextPendingTask().catch((err) => {
      console.error('Failed to process next task:', err)
    })
  }
}

// 错误分类函数
const categorizeError = (error: Error): DownloadFailReasonType => {
  const errorMessage = error.message ?? String(error)

  // 权限错误
  if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
    return DownloadFailReason.NoWritePermission
  }

  // 网络错误
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('ENETUNREACH') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('stalled')
  ) {
    return DownloadFailReason.NetworkError
  }

  // 磁盘空间错误
  if (errorMessage.includes('ENOSPC') || errorMessage.includes('space')) {
    return DownloadFailReason.Unknown // 可以考虑添加新的错误类型
  }

  // 获取源失败
  if (errorMessage.includes('fetch') || errorMessage.includes('source') || errorMessage.includes('url')) {
    return DownloadFailReason.FailToFetchSource
  }

  return DownloadFailReason.Unknown
}

// 状态转换辅助函数
const transitionTaskState = (
  task: DownloadTaskInfo,
  newStatus: DownloadStatusType,
  errorReason?: DownloadFailReasonType,
): boolean => {
  const currentStatus = task.downloadStatus

  // 验证状态转换是否有效
  if (!isValidTransition(currentStatus, newStatus)) {
    console.warn(`Invalid state transition: ${currentStatus} -> ${newStatus}`)
    return false
  }

  // 更新任务状态
  task.downloadStatus = newStatus
  if (errorReason) {
    task.errorReason = errorReason
  }

  // 更新 item 状态（保持向后兼容）
  task.item.downloadStatus = newStatus
  task.item.status = toLegacyStatus(newStatus)
  task.item.statusText = getStatusText(newStatus, errorReason)
  if (errorReason) {
    task.item.errorReason = errorReason
  }

  // 通知状态更新
  downloadAction.updateDownloadStatus(task.item.id, newStatus, errorReason)

  return true
}

// 验证文件路径是否有效
const validateFilePath = (filePath: string): boolean => {
  // 检查路径是否为空
  if (!filePath || filePath.trim().length === 0) {
    return false
  }

  // 检查路径是否包含非法字符（Windows和Unix通用）
  // eslint-disable-next-line no-control-regex
  const illegalChars = /[<>:"|?*\x00-\x1f]/
  if (illegalChars.test(filePath)) {
    return false
  }

  // 检查文件名长度（大多数文件系统限制为255字符）
  const fileName = filePath.split('/').pop() ?? ''
  if (fileName.length > 255) {
    return false
  }

  return true
}

// 递归创建目录
const mkdirRecursive = async(path: string): Promise<void> => {
  // 规范化路径，移除末尾的斜杠
  const normalizedPath = path.replace(/\/+$/, '')

  // 分割路径
  const parts = normalizedPath.split('/').filter(part => part.length > 0)

  // 判断是否是绝对路径
  const isAbsolute = normalizedPath.startsWith('/')
  let currentPath = isAbsolute ? '' : '.'

  for (const part of parts) {
    currentPath += '/' + part

    try {
      const exists = await existsFile(currentPath)
      if (!exists) {
        await mkdir(currentPath)
      }
    } catch (error: unknown) {
      // 如果错误不是"目录已存在"，则记录错误
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('exists') && !errorMessage.includes('EEXIST')) {
        console.warn('mkdir error:', currentPath, errorMessage)
        throw error
      }
    }
  }
}

// 获取下载保存路径
const getDownloadPath = async() => {
  const configPath = settingState.setting['download.savePath']
  const savePath = typeof configPath === 'string' ? configPath : '/storage/emulated/0/Music/LxMusic'

  console.log('Getting download path:', savePath)

  try {
    // 确保目录存在
    const dirExists = await existsFile(savePath)
    console.log('Directory exists:', dirExists)
    
    if (!dirExists) {
      console.log('Creating directory:', savePath)
      await mkdirRecursive(savePath)
      console.log('Directory created successfully')
    }

    return savePath
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to create download directory:', savePath, errorMessage)
    throw new Error(`无法创建下载目录: ${errorMessage}`)
  }
}

// 生成文件名
const generateFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality, ext: LX.Download.FileExt): string => {
  const configFormat = settingState.setting['download.fileName']
  const fileNameFormat = typeof configFormat === 'string' ? configFormat : '歌名 - 歌手'

  let fileName = fileNameFormat
    .replace('歌名', musicInfo.name)
    .replace('歌手', musicInfo.singer)

  // 移除文件名中的非法字符
  fileName = fileName.replace(/[\\/:*?"<>|]/g, '_')

  return `${fileName}.${ext}`
}

// 根据音质获取文件扩展名
const getFileExt = (quality: LX.Quality): LX.Download.FileExt => {
  if (quality.includes('flac')) return 'flac'
  if (quality.includes('ape')) return 'ape'
  if (quality.includes('wav')) return 'wav'
  return 'mp3'
}

// 处理下一个待下载任务
const downloadNextPendingTask = async() => {
  const maxDownloadCount = getMaxDownloadCount()

  // 如果超过最大下载数量，或者没有待下载任务，则不执行
  if (downloadingCount >= maxDownloadCount || downloadQueue.length === 0) {
    return
  }

  // 寻找下一个等待中的任务
  let nextTaskId: string | null = null
  for (const id of downloadQueue) {
    const task = downloadTasks.get(id)
    if (task && task.downloadStatus === DownloadStatus.Pending) {
      nextTaskId = id
      break
    }
  }

  // 没有下一个任务了
  if (!nextTaskId) {
    return
  }

  const task = downloadTasks.get(nextTaskId)
  if (!task) return

  // 开始下载
  await startDownload(task.item)
}

// 开始下载任务
const startDownload = async(item: LX.Download.ListItem) => {
  const task = downloadTasks.get(item.id)
  if (!task) return

  try {
    downloadingCount++

    // 状态转换: Pending -> Preparing
    if (!transitionTaskState(task, DownloadStatus.Preparing)) {
      downloadingCount--
      return
    }

    // 记录下载开始时间
    task.downloadStartTime = Date.now()

    // 获取音乐URL
    let url: string
    try {
      url = await getMusicUrl({
        musicInfo: item.metadata.musicInfo,
        isRefresh: true,
      })
      item.metadata.url = url
    } catch (error: unknown) {
      // 获取链接失败
      await handleDownloadError(item.id, error instanceof Error ? error : new Error(String(error)), DownloadFailReason.FailToFetchSource)
      return
    }

    // 确保下载目录存在
    try {
      const downloadPath = await getDownloadPath()
      // 更新文件路径（如果配置改变了）
      if (!item.metadata.filePath.startsWith(downloadPath)) {
        item.metadata.filePath = `${downloadPath}/${item.metadata.fileName}`
      }
      
      // 再次确认目录存在
      const dirExists = await existsFile(downloadPath)
      if (!dirExists) {
        throw new Error(`下载目录不存在且无法创建: ${downloadPath}`)
      }
      
      console.log('Download directory verified:', downloadPath)
      console.log('Download file path:', item.metadata.filePath)
    } catch (error: unknown) {
      // 目录创建失败
      await handleDownloadError(item.id, error instanceof Error ? error : new Error(String(error)), DownloadFailReason.NoWritePermission)
      return
    }

    // 状态转换: Preparing -> Downloading
    if (!transitionTaskState(task, DownloadStatus.Downloading)) {
      downloadingCount--
      return
    }

    // 设置超时检查
    setupTimeoutChecker(item.id, task)

    // 记录开始时间和进度跟踪
    const startTime = Date.now()
    let lastUpdateTime = startTime
    let lastBytesWritten = 0

    // 开始下载文件
    const { jobId, promise } = downloadFile(url, item.metadata.filePath, {
      begin: (res) => {
        task.lastProgressUpdate = Date.now()
        const initialProgress = {
          progress: 0,
          speed: '0 KB/s',
          downloaded: 0,
          total: res.contentLength,
          downloadedFormatted: formatFileSize(0),
          totalFormatted: formatFileSize(res.contentLength),
          remainingTime: '',
        }
        // 立即更新初始进度
        downloadAction.updateProgress(item.id, initialProgress)
      },
      progress: (res) => {
        const now = Date.now()

        // 更新最后进度时间（用于停滞检测）
        task.lastProgressUpdate = now

        // 节流：如果距离上次更新时间太短，跳过此次更新（除非是最后一次更新）
        const isComplete = res.bytesWritten >= res.contentLength
        if (!isComplete && task.lastProgressUpdate && (now - task.lastProgressUpdate) < PROGRESS_UPDATE_THROTTLE) {
          return
        }

        const elapsedTime = (now - startTime) / 1000 // 总耗时（秒）
        const timeSinceLastUpdate = (now - lastUpdateTime) / 1000 // 距上次更新的时间（秒）

        // 计算进度百分比
        const progress = (res.bytesWritten / res.contentLength) * 100

        // 计算即时速度（基于最近的更新间隔）
        let instantSpeed = 0
        if (timeSinceLastUpdate > 0) {
          instantSpeed = (res.bytesWritten - lastBytesWritten) / timeSinceLastUpdate
        }

        // 计算平均速度
        const averageSpeed = elapsedTime > 0 ? res.bytesWritten / elapsedTime : 0

        // 使用平均速度和即时速度的加权平均，使速度显示更平滑
        const displaySpeed = averageSpeed * 0.3 + instantSpeed * 0.7

        // 计算剩余时间
        const remainingSeconds = calculateRemainingTime(res.bytesWritten, res.contentLength, displaySpeed)
        const remainingTime = remainingSeconds > 0 ? formatRemainingTime(remainingSeconds) : ''

        // 使用批量更新机制
        scheduleProgressUpdate(item.id, {
          progress,
          speed: formatSpeed(displaySpeed),
          downloaded: res.bytesWritten,
          total: res.contentLength,
          downloadedFormatted: formatFileSize(res.bytesWritten),
          totalFormatted: formatFileSize(res.contentLength),
          remainingTime,
        })

        // 更新追踪变量
        lastUpdateTime = now
        lastBytesWritten = res.bytesWritten
      },
    })

    task.jobId = jobId

    // 处理下一个任务
    downloadNextPendingTask().catch((err) => {
      console.error('Failed to process next task:', err)
    })

    // 等待下载完成
    await promise

    // 清理超时检查器
    clearTimeoutChecker(item.id)

    // 状态转换: Downloading -> Completed
    transitionTaskState(task, DownloadStatus.Completed)

    // 下载完成
    downloadingCount--
    downloadTasks.delete(item.id)

    // 从队列中移除
    const queueIndex = downloadQueue.indexOf(item.id)
    if (queueIndex >= 0) {
      downloadQueue.splice(queueIndex, 1)
    }

    // 继续处理下一个任务
    void downloadNextPendingTask()
  } catch (error: unknown) {
    // 统一错误处理
    await handleDownloadError(item.id, error instanceof Error ? error : new Error(String(error)))
  }
}

// 单个音乐下载
export const downloadMusic = async(
  musicInfo: LX.Music.MusicInfoOnline,
  quality: LX.Quality,
): Promise<LX.Download.ListItem> => {
  const id = generateId()
  const ext = getFileExt(quality)
  const fileName = generateFileName(musicInfo, quality, ext)
  const savePath = await getDownloadPath()
  const filePath = `${savePath}/${fileName}`

  // 验证文件路径
  if (!validateFilePath(filePath)) {
    throw new Error(`无效的文件路径: ${filePath}`)
  }

  // 创建下载项
  const downloadItem: LX.Download.ListItem = {
    id,
    isComplate: false,
    status: 'waiting',
    statusText: '等待中...',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '0 KB/s',
    metadata: {
      musicInfo,
      url: null,
      quality,
      ext,
      fileName,
      filePath,
    },
    // State machine fields
    downloadStatus: DownloadStatus.Pending,
  }

  // 添加到任务队列
  downloadQueue.push(id)
  downloadTasks.set(id, {
    musicInfo,
    quality,
    item: downloadItem,
    downloadStatus: DownloadStatus.Pending,
    retryCount: 0,
  })

  // 触发下载
  downloadNextPendingTask().catch((err) => {
    console.error('Failed to process next task:', err)
  })

  return downloadItem
}

// 批量下载音乐
export const downloadMusicBatch = async(
  musicList: LX.Music.MusicInfoOnline[],
  quality: LX.Quality,
): Promise<LX.Download.ListItem[]> => {
  const items: LX.Download.ListItem[] = []

  for (const musicInfo of musicList) {
    const item = await downloadMusic(musicInfo, quality)
    items.push(item)
  }

  return items
}

export const pauseDownload = async(id: string) => {
  const task = downloadTasks.get(id)
  if (!task) return

  // 检查是否可以暂停
  if (!canPause(task.downloadStatus)) {
    console.warn(`Cannot pause download in state: ${task.downloadStatus}`)
    return
  }

  // 清理超时检查器
  clearTimeoutChecker(id)

  // 停止下载任务
  if (task.jobId) {
    stopDownload(task.jobId)
    downloadingCount--
  }

  // 状态转换: * -> Paused
  transitionTaskState(task, DownloadStatus.Paused)

  // 继续处理下一个任务
  downloadNextPendingTask().catch((err) => {
    console.error('Failed to process next task:', err)
  })
}

export const resumeDownload = async(id: string) => {
  const { state } = await import('@/store/download')
  const item = state.list.find((i: LX.Download.ListItem) => i.id === id)
  if (!item) return

  const task = downloadTasks.get(id)
  if (!task) return

  // 检查是否可以恢复
  if (!canResume(task.downloadStatus)) {
    console.warn(`Cannot resume download in state: ${task.downloadStatus}`)
    return
  }

  // 状态转换: Paused -> Pending
  transitionTaskState(task, DownloadStatus.Pending)

  // 重新添加到队列
  if (!downloadQueue.includes(id)) {
    downloadQueue.push(id)
  }

  // 触发下载
  downloadNextPendingTask().catch((err) => {
    console.error('Failed to process next task:', err)
  })
}

export const removeDownload = async(id: string) => {
  const task = downloadTasks.get(id)
  if (task) {
    // 清理超时检查器
    clearTimeoutChecker(id)

    if (task.jobId) {
      stopDownload(task.jobId)
      downloadingCount--
    }
    downloadTasks.delete(id)

    // 从队列中移除
    const queueIndex = downloadQueue.indexOf(id)
    if (queueIndex >= 0) {
      downloadQueue.splice(queueIndex, 1)
    }

    // 清理待处理的进度更新
    progressUpdateQueue.delete(id)

    // 继续处理下一个任务
    downloadNextPendingTask().catch((err) => {
      console.error('Failed to process next task:', err)
    })
  }
}

// 暂停所有下载
export const pauseAllDownloads = async() => {
  const { state } = await import('@/store/download')
  const runningTasks = state.list.filter((i: LX.Download.ListItem) => i.status === 'run' || i.status === 'waiting')

  for (const item of runningTasks) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await pauseDownload(item.id)
  }
}

// 恢复所有下载
export const resumeAllDownloads = async() => {
  const { state } = await import('@/store/download')
  const pausedTasks = state.list.filter((i: LX.Download.ListItem) => i.status === 'pause')

  for (const item of pausedTasks) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await resumeDownload(item.id)
  }
}

// 重试失败的下载（内部使用，支持自动重试）
const retryDownloadInternal = async(id: string) => {
  const { state } = await import('@/store/download')
  const item = state.list.find((i: LX.Download.ListItem) => i.id === id)
  if (!item) return

  const task = downloadTasks.get(id)

  // 如果任务不存在或不能重试，返回
  if (task && !canRetry(task.downloadStatus)) {
    console.warn(`Cannot retry download in state: ${task.downloadStatus}`)
    return
  }

  // 重置进度
  item.progress = 0
  item.downloaded = 0
  item.speed = '0 KB/s'

  // 重新添加到队列
  if (!downloadQueue.includes(id)) {
    downloadQueue.push(id)
  }

  // 重新创建或更新任务
  if (!task) {
    downloadTasks.set(id, {
      musicInfo: item.metadata.musicInfo,
      quality: item.metadata.quality,
      item,
      downloadStatus: DownloadStatus.Pending,
      retryCount: 0,
    })
  } else {
    // 状态转换: Error -> Pending
    transitionTaskState(task, DownloadStatus.Pending)
  }

  // 触发下载
  downloadNextPendingTask().catch((err) => {
    console.error('Failed to process next task:', err)
  })
}

// 重试失败的下载（用户手动触发）
export const retryDownload = async(id: string) => {
  const { state } = await import('@/store/download')
  const item = state.list.find((i: LX.Download.ListItem) => i.id === id)
  if (!item) return

  const task = downloadTasks.get(id)

  // 如果任务不存在或不能重试，返回
  if (task && !canRetry(task.downloadStatus)) {
    console.warn(`Cannot retry download in state: ${task.downloadStatus}`)
    return
  }

  // 重置状态
  item.progress = 0
  item.downloaded = 0
  item.speed = '0 KB/s'

  // 重新添加到队列
  if (!downloadQueue.includes(id)) {
    downloadQueue.push(id)
  }

  // 重新创建或更新任务
  if (!task) {
    downloadTasks.set(id, {
      musicInfo: item.metadata.musicInfo,
      quality: item.metadata.quality,
      item,
      downloadStatus: DownloadStatus.Pending,
      retryCount: 0, // 用户手动重试时重置重试计数
    })
  } else {
    // 用户手动重试时重置重试计数
    task.retryCount = 0
    task.lastError = undefined
    // 状态转换: Error -> Pending
    transitionTaskState(task, DownloadStatus.Pending)
  }

  // 触发下载
  downloadNextPendingTask().catch((err) => {
    console.error('Failed to process next task:', err)
  })
}

/**
 * Progress Tracking System
 *
 * This module implements comprehensive progress tracking for download tasks:
 *
 * Features:
 * - Real-time progress updates with percentage
 * - Download speed calculation (instant and average)
 * - File size formatting (B, KB, MB, GB)
 * - Remaining time estimation
 * - Progress update throttling for performance
 *
 * Progress Information:
 * - progress: Download percentage (0-100)
 * - speed: Current download speed (formatted string)
 * - downloaded: Bytes downloaded
 * - total: Total file size in bytes
 * - downloadedFormatted: Human-readable downloaded size
 * - totalFormatted: Human-readable total size
 * - remainingTime: Estimated time remaining
 *
 * Performance Optimizations:
 * - Progress updates are throttled to 500ms intervals
 * - Speed calculation uses weighted average (30% average, 70% instant)
 * - Smooth speed display to avoid jitter
 */

// 格式化速度
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes.toFixed(0)} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}

// 格式化剩余时间
const formatRemainingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }
}

// 计算剩余时间
const calculateRemainingTime = (downloaded: number, total: number, speed: number): number => {
  if (speed <= 0 || downloaded >= total) return 0
  const remaining = total - downloaded
  return remaining / speed
}

// 导出队列信息（用于调试和监控）
export const getQueueInfo = () => {
  return {
    queueLength: downloadQueue.length,
    downloadingCount,
    maxDownloadCount: getMaxDownloadCount(),
    tasks: Array.from(downloadTasks.entries()).map(([id, task]) => ({
      id,
      musicName: task.musicInfo.name,
      status: task.item.status,
      downloadStatus: task.downloadStatus,
      retryCount: task.retryCount,
      errorReason: task.errorReason,
      lastError: task.lastError?.message,
    })),
  }
}

// 获取任务的重试信息
export const getRetryInfo = (id: string) => {
  const task = downloadTasks.get(id)
  if (!task) return null

  return {
    retryCount: task.retryCount,
    maxRetries: MAX_RETRY_ATTEMPTS,
    canRetry: canRetry(task.downloadStatus),
    lastError: task.lastError?.message,
    lastRetryTime: task.lastRetryTime,
    errorReason: task.errorReason,
  }
}

// 清理所有超时检查器（用于应用退出时）
export const cleanupTimeoutCheckers = () => {
  for (const [, checker] of timeoutCheckers.entries()) {
    clearTimeout(checker)
  }
  timeoutCheckers.clear()
}
