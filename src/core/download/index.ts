import { downloadFile, stopDownload, exists, mkdir } from '@/utils/fs'
import { getMusicUrl } from '@/core/music'
import settingState from '@/store/setting/state'
import { downloadAction } from '@/store/download'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

const downloadTasks = new Map<string, { jobId: number, musicInfo: LX.Music.MusicInfoOnline }>()

// 获取下载保存路径
const getDownloadPath = async () => {
  let savePath = settingState.setting['download.savePath'] || '/storage/emulated/0/Music/LxMusic'
  
  // 确保目录存在
  const dirExists = await exists(savePath)
  if (!dirExists) {
    await mkdir(savePath, { recursive: true })
  }
  
  return savePath
}

// 生成文件名
const generateFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality, ext: LX.Download.FileExt): string => {
  const fileNameFormat = settingState.setting['download.fileName'] || '歌名 - 歌手'
  
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

export const downloadMusic = async (
  musicInfo: LX.Music.MusicInfoOnline,
  quality: LX.Quality
): Promise<LX.Download.ListItem> => {
  const id = nanoid()
  const ext = getFileExt(quality)
  const fileName = generateFileName(musicInfo, quality, ext)
  const savePath = await getDownloadPath()
  const filePath = `${savePath}/${fileName}`

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
  }

  // 开始下载
  startDownload(downloadItem)

  return downloadItem
}

const startDownload = async (item: LX.Download.ListItem) => {
  try {
    // 更新状态为获取链接中
    downloadAction.updateStatus(item.id, 'waiting', '获取下载链接...')

    // 获取音乐URL
    const url = await getMusicUrl({
      musicInfo: item.metadata.musicInfo,
      isRefresh: true,
    })

    item.metadata.url = url

    // 更新状态为下载中
    downloadAction.updateStatus(item.id, 'run', '下载中...')

    // 开始下载文件
    const { jobId, promise } = downloadFile(url, item.metadata.filePath, {
      begin: (res) => {
        downloadAction.updateProgress(item.id, {
          progress: 0,
          speed: '0 KB/s',
          downloaded: 0,
          total: res.contentLength,
        })
      },
      progress: (res) => {
        const progress = (res.bytesWritten / res.contentLength) * 100
        const speed = formatSpeed(res.bytesWritten / ((Date.now() - startTime) / 1000))
        
        downloadAction.updateProgress(item.id, {
          progress,
          speed,
          downloaded: res.bytesWritten,
          total: res.contentLength,
        })
      },
    })

    const startTime = Date.now()
    downloadTasks.set(item.id, { jobId, musicInfo: item.metadata.musicInfo })

    // 等待下载完成
    await promise

    // 下载完成
    downloadTasks.delete(item.id)
    downloadAction.updateStatus(item.id, 'completed', '下载完成')
  } catch (error: any) {
    downloadTasks.delete(item.id)
    downloadAction.updateStatus(item.id, 'error', error.message || '下载失败')
  }
}

export const pauseDownload = async (id: string) => {
  const task = downloadTasks.get(id)
  if (task) {
    stopDownload(task.jobId)
    downloadTasks.delete(id)
  }
}

export const resumeDownload = async (id: string) => {
  const { state } = await import('@/store/download')
  const item = state.list.find(i => i.id === id)
  if (item && item.status === 'pause') {
    startDownload(item)
  }
}

export const removeDownload = async (id: string) => {
  const task = downloadTasks.get(id)
  if (task) {
    stopDownload(task.jobId)
    downloadTasks.delete(id)
  }
}

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
