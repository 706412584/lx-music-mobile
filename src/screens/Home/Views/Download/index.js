import React from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text as RNText,
} from 'react-native'
import { useDownloadList, useDownloadingCount } from '@/store/download'
import downloadAction from '@/store/download/action'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { Navigation } from 'react-native-navigation'

const DownloadItem = ({ item }) => {
  const theme = useTheme()
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  // 监听进度更新
  React.useEffect(() => {
    const handleUpdate = () => {
      forceUpdate()
    }
    global.state_event.on('downloadListUpdated', handleUpdate)
    return () => {
      global.state_event.off('downloadListUpdated', handleUpdate)
    }
  }, [])

  const handlePause = () => {
    downloadAction.pauseDownload(item.id)
  }

  const handleResume = () => {
    downloadAction.resumeDownload(item.id)
  }

  const handleRemove = () => {
    downloadAction.removeDownload(item.id)
  }

  const handleRetry = () => {
    downloadAction.retryDownload(item.id)
  }

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed': return theme['c-primary']
      case 'error': return theme['c-error']
      case 'run': return theme['c-primary']
      case 'pause': return theme['c-font-label']
      default: return theme['c-font']
    }
  }

  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed': return 'play-outline'
      case 'error': return 'close'
      case 'run': return 'download-2'
      case 'pause': return 'pause'
      case 'waiting': return 'music_time'
      default: return 'download-2'
    }
  }

  return (
    <View style={[styles.item, { backgroundColor: theme['c-content-background'] + 'CC' }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <View style={styles.albumCover}>
            <Image
              url={item.metadata?.musicInfo?.meta?.picUrl}
              style={styles.albumImage}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text size={15} color={theme['c-font']} style={styles.itemName} numberOfLines={1}>
              {item.metadata?.musicInfo?.name || '未知歌曲'}
            </Text>
            <Text size={13} color={theme['c-font-label']} style={styles.itemSinger} numberOfLines={1}>
              {item.metadata?.musicInfo?.singer || '未知艺术家'}
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          {(item.status === 'run' || item.status === 'waiting') && (
            <TouchableOpacity onPress={handlePause} style={styles.actionBtn}>
              <Icon name="pause" size={scaleSizeW(20)} color={theme['c-font']} />
            </TouchableOpacity>
          )}
          {item.status === 'pause' && (
            <TouchableOpacity onPress={handleResume} style={styles.actionBtn}>
              <Icon name="play" size={scaleSizeW(20)} color={theme['c-primary']} />
            </TouchableOpacity>
          )}
          {item.status === 'error' && (
            <TouchableOpacity onPress={handleRetry} style={styles.actionBtn}>
              <Icon name="single-loop" size={scaleSizeW(20)} color={theme['c-primary']} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleRemove} style={styles.actionBtn}>
            <Icon name="close" size={scaleSizeW(20)} color={theme['c-error']} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemProgress}>
        <View style={[styles.progressBar, { backgroundColor: theme['c-primary-alpha-200'] }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getStatusColor(),
                width: `${item.progress || 0}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <View style={styles.progressRow}>
            <Text size={13} color={getStatusColor()} style={styles.itemStatus}>
              {item.statusText || '等待中'}
            </Text>
            {item.progress > 0 && item.progress < 100 && (
              <Text size={12} color={theme['c-font-label']} style={styles.progressPercent}>
                {item.progress.toFixed(1)}%
              </Text>
            )}
          </View>
          {item.status === 'run' && (
            <Text size={11} color={theme['c-font-label']} style={styles.progressDetails}>
              {item.downloadedFormatted || ''} / {item.totalFormatted || ''} • {item.speed || ''}
              {item.remainingTime && ` • 剩余 ${item.remainingTime}`}
            </Text>
          )}
          {item.status === 'completed' && item.totalFormatted && (
            <Text size={11} color={theme['c-font-label']} style={styles.progressDetails}>
              文件大小: {item.totalFormatted}
            </Text>
          )}
          {(item.status === 'waiting' || item.status === 'pause') && item.progress > 0 && (
            <Text size={11} color={theme['c-font-label']} style={styles.progressDetails}>
              {item.downloadedFormatted || ''} / {item.totalFormatted || ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default ({ componentId }) => {
  const theme = useTheme()
  const downloadList = useDownloadList()
  const downloadingCount = useDownloadingCount()
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  // 监听页面显示，自动刷新
  React.useEffect(() => {
    const listener = Navigation.events().registerComponentDidAppearListener(({ componentId: appearedComponentId }) => {
      if (appearedComponentId === componentId) {
        forceUpdate()
      }
    })
    return () => listener.remove()
  }, [componentId])

  // 定时刷新进度（仅在有下载任务时）
  React.useEffect(() => {
    if (downloadingCount === 0) return
    
    const timer = setInterval(() => {
      forceUpdate()
    }, 1000)
    return () => clearInterval(timer)
  }, [downloadingCount])

  const handleClearCompleted = () => {
    console.log('Clearing completed downloads...')
    downloadAction.clearCompleted()
    console.log('After clear, list length:', downloadList.length)
  }

  const handleClearAll = () => {
    console.log('Clearing all downloads...')
    downloadAction.clearAll()
    console.log('After clear all, list length:', downloadList.length)
  }

  const handlePauseAll = () => {
    console.log('Pausing all downloads...')
    downloadAction.pauseAll()
  }

  const handleResumeAll = () => {
    console.log('Resuming all downloads...')
    downloadAction.resumeAll()
  }

  const completedCount = downloadList.filter(item => item.status === 'completed').length
  const errorCount = downloadList.filter(item => item.status === 'error').length
  const pausedCount = downloadList.filter(item => item.status === 'pause').length
  const activeCount = downloadList.filter(item => item.status === 'run' || item.status === 'waiting').length

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {downloadList.length > 0 && (
        <View style={[styles.header, { backgroundColor: theme['c-content-background'] + 'E6' }]}>
          <View style={styles.headerActions}>
            {activeCount > 0 && (
              <TouchableOpacity 
                onPress={handlePauseAll} 
                style={[styles.textBtn, { backgroundColor: theme['c-font'] }]}
              >
                <RNText style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>暂停</RNText>
              </TouchableOpacity>
            )}
            
            {pausedCount > 0 && (
              <TouchableOpacity 
                onPress={handleResumeAll} 
                style={[styles.textBtn, { backgroundColor: theme['c-primary'] }]}
              >
                <RNText style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>开始</RNText>
              </TouchableOpacity>
            )}
            
            {completedCount > 0 && (
              <TouchableOpacity 
                onPress={handleClearCompleted} 
                style={[styles.textBtn, { backgroundColor: theme['c-primary'] }]}
              >
                <RNText style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>清除完成</RNText>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={handleClearAll} 
              style={[styles.textBtn, { backgroundColor: '#FF5252' }]}
            >
              <RNText style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>清空全部</RNText>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {downloadList.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme['c-primary-alpha-200'] }]}>
            <Icon name="download-2" size={scaleSizeW(48)} color={theme['c-primary']} />
          </View>
          <Text size={18} color={theme['c-font']} style={styles.emptyTitle}>
            暂无下载任务
          </Text>
          <Text size={14} color={theme['c-font-label']} style={styles.emptyDesc}>
            下载的音乐将显示在这里
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DownloadItem item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(15),
    paddingVertical: scaleSizeH(10),
    borderBottomWidth: 0,
    backdropFilter: 'blur(10px)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  textBtn: {
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: scaleSizeW(12),
  },
  item: {
    padding: scaleSizeW(15),
    marginBottom: scaleSizeH(12),
    borderRadius: scaleSizeW(12),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSizeH(12),
  },
  itemHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaleSizeW(10),
  },
  albumCover: {
    width: scaleSizeW(48),
    height: scaleSizeW(48),
    borderRadius: scaleSizeW(6),
    overflow: 'hidden',
    marginRight: scaleSizeW(12),
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: scaleSizeH(4),
  },
  itemSinger: {
  },
  itemProgress: {
    marginTop: scaleSizeH(6),
  },
  progressBar: {
    height: scaleSizeH(6),
    borderRadius: scaleSizeH(3),
    overflow: 'hidden',
    marginBottom: scaleSizeH(6),
  },
  progressFill: {
    height: '100%',
    borderRadius: scaleSizeH(3),
  },
  progressInfo: {
    marginTop: scaleSizeH(4),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSizeH(4),
  },
  itemStatus: {
    fontWeight: '600',
  },
  progressPercent: {
    fontWeight: '500',
  },
  progressDetails: {
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: scaleSizeW(8),
    borderRadius: scaleSizeW(6),
    marginLeft: scaleSizeW(4),
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(40),
  },
  emptyIcon: {
    width: scaleSizeW(96),
    height: scaleSizeW(96),
    borderRadius: scaleSizeW(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSizeH(16),
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: scaleSizeH(16),
  },
  emptyDesc: {
    textAlign: 'center',
  },
})
