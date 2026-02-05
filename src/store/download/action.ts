import { state } from './state'
import {
  downloadMusic,
  downloadMusicBatch,
  pauseDownload,
  resumeDownload,
  removeDownload,
  pauseAllDownloads,
  resumeAllDownloads,
  retryDownload,
} from '@/core/download'
import { requestStoragePermission } from '@/core/common'
import { toast } from '@/utils/tools'
import type { DownloadStatusType, DownloadFailReasonType } from '@/core/download/stateMachine'

// 批量状态更新队列
let updateBatchTimer: NodeJS.Timeout | null = null
const pendingUpdates = new Set<string>()

// 批量更新下载计数
const scheduleBatchUpdate = () => {
  if (!updateBatchTimer) {
    updateBatchTimer = setTimeout(() => {
      if (pendingUpdates.size > 0) {
        // 批量计算下载中的任务数量
        state.downloadingCount = state.list.filter(i => i.status === 'run' || i.status === 'waiting').length
        pendingUpdates.clear()
        // 触发更新事件
        global.state_event.emit('downloadListUpdated')
      }
      updateBatchTimer = null
    }, 100)
  }
}

export default {
  async addDownload(musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality) {
    // 检查存储权限
    const hasPermission = await requestStoragePermission()
    if (!hasPermission) {
      toast(global.i18n.t('download_permission_denied'))
      return null
    }

    // 先检查是否已存在（去重）- 包括所有状态
    const existingItem = state.list.find(i => 
      i.metadata.musicInfo.id === musicInfo.id && 
      i.metadata.quality === quality
    )
    
    if (existingItem) {
      console.log('✓ Found duplicate download:', musicInfo.name, 'Status:', existingItem.status)
      
      // 如果是暂停状态，恢复下载
      if (existingItem.status === 'pause') {
        console.log('  → Resuming paused download')
        await this.resumeDownload(existingItem.id)
      }
      // 如果是错误状态，重试下载
      else if (existingItem.status === 'error') {
        console.log('  → Retrying failed download')
        await this.retryDownload(existingItem.id)
      }
      // 如果是已完成或正在下载，直接返回
      else {
        console.log('  → Skipping (already', existingItem.status + ')')
      }
      
      return existingItem
    }

    console.log('✓ No duplicate found, adding new download:', musicInfo.name)
    const item = await downloadMusic(musicInfo, quality)
    state.list.push(item)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
    return item
  },

  async addDownloadBatch(musicList: LX.Music.MusicInfoOnline[], quality: LX.Quality) {
    // 检查存储权限
    const hasPermission = await requestStoragePermission()
    if (!hasPermission) {
      toast(global.i18n.t('download_permission_denied'))
      return []
    }

    const newItems: LX.Download.ListItem[] = []
    let skippedCount = 0

    for (const musicInfo of musicList) {
      // 检查是否已存在
      const existingItem = state.list.find(i => 
        i.metadata.musicInfo.id === musicInfo.id && 
        i.metadata.quality === quality &&
        (i.status === 'waiting' || i.status === 'run' || i.status === 'pause')
      )
      
      if (existingItem) {
        skippedCount++
        continue
      }

      try {
        const item = await downloadMusic(musicInfo, quality)
        newItems.push(item)
      } catch (error) {
        console.error('Failed to add download:', musicInfo.name, error)
      }
    }

    if (newItems.length > 0) {
      state.list.push(...newItems)
      pendingUpdates.add('count')
      scheduleBatchUpdate()
    }

    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} duplicate downloads`)
    }

    return newItems
  },

  async pauseDownload(id: string) {
    await pauseDownload(id)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
  },

  async resumeDownload(id: string) {
    await resumeDownload(id)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
  },

  async removeDownload(id: string) {
    await removeDownload(id)
    const index = state.list.findIndex(i => i.id === id)
    if (index >= 0) {
      state.list.splice(index, 1)
      pendingUpdates.add('count')
      scheduleBatchUpdate()
    }
  },

  async pauseAll() {
    await pauseAllDownloads()
    pendingUpdates.add('count')
    scheduleBatchUpdate()
  },

  async resumeAll() {
    await resumeAllDownloads()
    pendingUpdates.add('count')
    scheduleBatchUpdate()
  },

  async retryDownload(id: string) {
    await retryDownload(id)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
  },

  updateProgress(id: string, progress: LX.Download.ProgressInfo) {
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.progress = progress.progress
      item.speed = progress.speed
      item.downloaded = progress.downloaded
      item.total = progress.total
      if (progress.downloadedFormatted) {
        item.downloadedFormatted = progress.downloadedFormatted
      }
      if (progress.totalFormatted) {
        item.totalFormatted = progress.totalFormatted
      }
      if (progress.remainingTime !== undefined) {
        item.remainingTime = progress.remainingTime
      }
      // 触发更新事件（进度更新）
      global.state_event.emit('downloadListUpdated')
    }
  },

  updateStatus(id: string, status: LX.Download.DownloadTaskStatus, statusText?: string) {
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.status = status
      if (statusText) item.statusText = statusText
      if (status === 'completed') item.isComplate = true
      pendingUpdates.add('count')
      scheduleBatchUpdate()
      // 立即触发更新事件，确保UI能及时响应
      global.state_event.emit('downloadListUpdated')
    }
  },

  // New method for state machine status updates
  updateDownloadStatus(id: string, downloadStatus: DownloadStatusType, errorReason?: DownloadFailReasonType) {
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.downloadStatus = downloadStatus
      if (errorReason) {
        item.errorReason = errorReason
      }
      // isComplate is set when status is Completed
      if (downloadStatus === 'completed') {
        item.isComplate = true
      }
    }
  },

  updateDownloadingCount() {
    state.downloadingCount = state.list.filter(i => i.status === 'run' || i.status === 'waiting').length
  },

  clearCompleted() {
    console.log('clearCompleted called, before:', state.list.length)
    // Use splice to modify array in place for reactivity
    for (let i = state.list.length - 1; i >= 0; i--) {
      if (state.list[i].isComplate) {
        state.list.splice(i, 1)
      }
    }
    console.log('clearCompleted after filter:', state.list.length)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
    global.state_event.emit('downloadListUpdated')
  },

  clearAll() {
    console.log('clearAll called, before:', state.list.length)
    state.list.forEach(item => {
      if (item.status === 'run' || item.status === 'waiting') {
        void removeDownload(item.id as string).catch(() => {
          // Ignore errors during cleanup
        })
      }
    })
    // Use splice to clear array in place for reactivity
    state.list.splice(0, state.list.length)
    state.downloadingCount = 0
    console.log('clearAll after clear:', state.list.length)
    pendingUpdates.add('count')
    scheduleBatchUpdate()
    global.state_event.emit('downloadListUpdated')
  },
}
