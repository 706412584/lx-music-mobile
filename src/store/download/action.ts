import { state } from './state'
import { downloadMusic, pauseDownload, resumeDownload, removeDownload } from '@/core/download'

export default {
  async addDownload(musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality) {
    const item = await downloadMusic(musicInfo, quality)
    state.list.push(item)
    this.updateDownloadingCount()
    return item
  },

  async pauseDownload(id: string) {
    await pauseDownload(id)
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.status = 'pause'
      this.updateDownloadingCount()
    }
  },

  async resumeDownload(id: string) {
    await resumeDownload(id)
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.status = 'run'
      this.updateDownloadingCount()
    }
  },

  async removeDownload(id: string) {
    await removeDownload(id)
    const index = state.list.findIndex(i => i.id === id)
    if (index >= 0) {
      state.list.splice(index, 1)
      this.updateDownloadingCount()
    }
  },

  updateProgress(id: string, progress: LX.Download.ProgressInfo) {
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.progress = progress.progress
      item.speed = progress.speed
      item.downloaded = progress.downloaded
      item.total = progress.total
    }
  },

  updateStatus(id: string, status: LX.Download.DownloadTaskStatus, statusText?: string) {
    const item = state.list.find(i => i.id === id)
    if (item) {
      item.status = status
      if (statusText) item.statusText = statusText
      if (status === 'completed') item.isComplate = true
      this.updateDownloadingCount()
    }
  },

  updateDownloadingCount() {
    state.downloadingCount = state.list.filter(i => i.status === 'run' || i.status === 'waiting').length
  },

  clearCompleted() {
    state.list = state.list.filter(i => !i.isComplate)
  },

  clearAll() {
    state.list.forEach(item => {
      if (item.status === 'run' || item.status === 'waiting') {
        removeDownload(item.id).catch(() => {})
      }
    })
    state.list = []
    state.downloadingCount = 0
  },
}
