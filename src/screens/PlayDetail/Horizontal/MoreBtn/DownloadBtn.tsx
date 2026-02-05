import { memo, useMemo } from 'react'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import { downloadAction, useDownloadList } from '@/store/download'
import { toast } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

/**
 * 下载按钮组件（横屏）
 * 检测当前歌曲是否已下载，显示对应状态
 */
const DownloadBtn = memo(() => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const downloadList = useDownloadList()

  // 检查下载状态
  const { isDownloaded, isDownloading } = useMemo(() => {
    const musicInfo = playMusicInfo.musicInfo
    if (!musicInfo || musicInfo.source === 'local' || 'progress' in musicInfo) {
      return { isDownloaded: false, isDownloading: false }
    }

    // 检查是否已下载或正在下载
    const downloadItem = downloadList.find(item => 
      item.metadata.musicInfo.id === musicInfo.id
    )

    if (downloadItem) {
      return {
        isDownloaded: downloadItem.status === 'completed',
        isDownloading: downloadItem.status === 'run' || downloadItem.status === 'waiting'
      }
    }

    return { isDownloaded: false, isDownloading: false }
  }, [playMusicInfo.musicInfo, downloadList])

  const handlePress = async () => {
    const musicInfo = playMusicInfo.musicInfo
    
    // 本地音乐或下载列表中的音乐不需要下载
    if (!musicInfo || musicInfo.source === 'local' || 'progress' in musicInfo) {
      return
    }

    // 已下载，提示
    if (isDownloaded) {
      toast(global.i18n.t('download_completed'))
      return
    }

    // 正在下载，提示
    if (isDownloading) {
      toast(global.i18n.t('download_downloading'))
      return
    }

    // 开始下载
    try {
      // 获取最高音质
      const qualities = musicInfo.meta._qualitys || {}
      let quality: LX.Quality = '128k'

      if (qualities.flac24bit) quality = 'flac24bit'
      else if (qualities.flac) quality = 'flac'
      else if (qualities['320k']) quality = '320k'
      else if (qualities['192k']) quality = '192k'

      await downloadAction.addDownload(musicInfo, quality)
      toast(global.i18n.t('download_start_tip', { name: musicInfo.name }))
    } catch (error: any) {
      toast(global.i18n.t('download_error_tip', { name: musicInfo.name, error: error.message }))
    }
  }

  // 本地音乐不显示下载按钮
  const musicInfo = playMusicInfo.musicInfo
  if (!musicInfo || musicInfo.source === 'local' || 'progress' in musicInfo) {
    return null
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.5}
    >
      <Icon
        name={isDownloading ? 'available_updates' : 'download-2'}
        size={scaleSizeW(28)}
        color={isDownloaded ? theme['c-primary'] : theme['c-font-label']}
      />
    </TouchableOpacity>
  )
})

export default DownloadBtn
