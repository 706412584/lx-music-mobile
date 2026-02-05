import {
  saveLyric,
  saveMusicUrl,
  getMusicUrl as getStoreMusicUrl,
} from '@/utils/data'
import { updateListMusics } from '@/core/list'
import settingState from '@/store/setting/state'
import { state as downloadState } from '@/store/download/state'
import { existsFile } from '@/utils/fs'

import {
  buildLyricInfo,
  getPlayQuality,
  handleGetOnlineLyricInfo,
  handleGetOnlineMusicUrl,
  handleGetOnlinePicUrl,
  getCachedLyricInfo,
} from './utils'

/* export const setMusicUrl = ({ musicInfo, type, url }: {
  musicInfo: LX.Music.MusicInfo
  type: LX.Quality
  url: string
}) => {
  saveMusicUrl(musicInfo, type, url)
}

export const setPic = (datas: {
  listId: string
  musicInfo: LX.Music.MusicInfo
  url: string
}) => {
  datas.musicInfo.img = datas.url
  updateMusicInfo({
    listId: datas.listId,
    id: datas.musicInfo.songmid,
    data: { img: datas.url },
    musicInfo: datas.musicInfo,
  })
}
 */


export const getMusicUrl = async({ musicInfo, quality, isRefresh, allowToggleSource = true, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoOnline
  quality?: LX.Quality
  isRefresh: boolean
  allowToggleSource?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  // 检查是否已下载完成
  if (!isRefresh) {
    const downloadedItem = downloadState.list.find(item => 
      item.metadata.musicInfo.id === musicInfo.id && 
      item.status === 'completed'
    )
    
    if (downloadedItem) {
      console.log('[getMusicUrl] 找到已下载文件:', downloadedItem.metadata.filePath)
      // 检查文件是否存在
      const fileExists = await existsFile(downloadedItem.metadata.filePath).catch(() => false)
      if (fileExists) {
        console.log('[getMusicUrl] 使用本地下载文件')
        return `file://${downloadedItem.metadata.filePath}`
      } else {
        console.log('[getMusicUrl] 下载文件不存在，使用在线播放')
      }
    }
  }
  
  const targetQuality = quality ?? getPlayQuality(settingState.setting['player.playQuality'], musicInfo)
  const cachedUrl = await getStoreMusicUrl(musicInfo, targetQuality)
  if (cachedUrl && !isRefresh) return cachedUrl

  return handleGetOnlineMusicUrl({ musicInfo, quality, onToggleSource, isRefresh, allowToggleSource }).then(({ url, quality: targetQuality, musicInfo: targetMusicInfo, isFromCache }) => {
    if (targetMusicInfo.id != musicInfo.id && !isFromCache) void saveMusicUrl(targetMusicInfo, targetQuality, url)
    void saveMusicUrl(musicInfo, targetQuality, url)
    return url
  })
}

export const getPicUrl = async({ musicInfo, listId, isRefresh, allowToggleSource = true, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoOnline
  listId?: string | null
  isRefresh: boolean
  allowToggleSource?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<string> => {
  if (musicInfo.meta.picUrl && !isRefresh) return musicInfo.meta.picUrl
  return handleGetOnlinePicUrl({ musicInfo, onToggleSource, isRefresh, allowToggleSource }).then(({ url, musicInfo: targetMusicInfo, isFromCache }) => {
    // picRequest = null
    if (listId) {
      musicInfo.meta.picUrl = url
      void updateListMusics([{ id: listId, musicInfo }])
    }
    // savePic({ musicInfo, url, listId })
    return url
  })
}
export const getLyricInfo = async({ musicInfo, isRefresh, allowToggleSource = true, onToggleSource = () => {} }: {
  musicInfo: LX.Music.MusicInfoOnline
  isRefresh: boolean
  allowToggleSource?: boolean
  onToggleSource?: (musicInfo?: LX.Music.MusicInfoOnline) => void
}): Promise<LX.Player.LyricInfo> => {
  if (!isRefresh) {
    const lyricInfo = await getCachedLyricInfo(musicInfo)
    if (lyricInfo) return buildLyricInfo(lyricInfo)
  }

  // lrcRequest = music[musicInfo.source].getLyric(musicInfo)
  return handleGetOnlineLyricInfo({ musicInfo, onToggleSource, isRefresh, allowToggleSource }).then(async({ lyricInfo, musicInfo: targetMusicInfo, isFromCache }) => {
    // lrcRequest = null
    if (isFromCache) return buildLyricInfo(lyricInfo)
    if (targetMusicInfo.id == musicInfo.id) void saveLyric(musicInfo, lyricInfo)
    else void saveLyric(targetMusicInfo, lyricInfo)

    return buildLyricInfo(lyricInfo)
  })
}
