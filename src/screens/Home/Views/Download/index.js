import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useDownloadList, useDownloadingCount, downloadAction } from '@/store/download'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import Icon from '@/components/common/Icon'

const DownloadItem = ({ item }) => {
  const theme = useTheme()

  const handlePause = () => {
    downloadAction.pauseDownload(item.id)
  }

  const handleResume = () => {
    downloadAction.resumeDownload(item.id)
  }

  const handleRemove = () => {
    downloadAction.removeDownload(item.id)
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

  return (
    <View style={[styles.item, { backgroundColor: theme['c-content-background'] }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme['c-font'] }]} numberOfLines={1}>
          {item.metadata.musicInfo.name}
        </Text>
        <Text style={[styles.itemSinger, { color: theme['c-font-label'] }]} numberOfLines={1}>
          {item.metadata.musicInfo.singer}
        </Text>
        <View style={styles.itemProgress}>
          <View style={[styles.progressBar, { backgroundColor: theme['c-primary-alpha-200'] }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: getStatusColor(),
                  width: `${item.progress}%` 
                }
              ]} 
            />
          </View>
          <Text style={[styles.itemStatus, { color: getStatusColor() }]}>
            {item.statusText} {item.status === 'run' && `(${item.speed})`}
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
            <Icon name="play" size={scaleSizeW(20)} color={theme['c-font']} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleRemove} style={styles.actionBtn}>
          <Icon name="delete" size={scaleSizeW(20)} color={theme['c-error']} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default () => {
  const theme = useTheme()
  const downloadList = useDownloadList()
  const downloadingCount = useDownloadingCount()

  const handleClearCompleted = () => {
    downloadAction.clearCompleted()
  }

  const handleClearAll = () => {
    downloadAction.clearAll()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-primary-background'] }]}>
      <View style={[styles.header, { backgroundColor: theme['c-content-background'] }]}>
        <Text style={[styles.headerTitle, { color: theme['c-font'] }]}>
          下载管理 ({downloadingCount} 个下载中)
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleClearCompleted} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme['c-primary'] }]}>
              清除已完成
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: theme['c-error'] }]}>
              清空全部
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {downloadList.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="download" size={scaleSizeW(60)} color={theme['c-font-label']} />
          <Text style={[styles.emptyText, { color: theme['c-font-label'] }]}>
            暂无下载任务
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DownloadItem item={item} />}
          contentContainerStyle={styles.list}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(15),
    paddingVertical: scaleSizeH(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: scaleSizeW(16),
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleSizeW(10),
  },
  headerBtn: {
    paddingHorizontal: scaleSizeW(10),
    paddingVertical: scaleSizeH(5),
  },
  headerBtnText: {
    fontSize: scaleSizeW(14),
  },
  list: {
    padding: scaleSizeW(10),
  },
  item: {
    flexDirection: 'row',
    padding: scaleSizeW(12),
    marginBottom: scaleSizeH(10),
    borderRadius: scaleSizeW(8),
  },
  itemInfo: {
    flex: 1,
    marginRight: scaleSizeW(10),
  },
  itemName: {
    fontSize: scaleSizeW(15),
    fontWeight: '500',
    marginBottom: scaleSizeH(4),
  },
  itemSinger: {
    fontSize: scaleSizeW(13),
    marginBottom: scaleSizeH(8),
  },
  itemProgress: {
    gap: scaleSizeH(4),
  },
  progressBar: {
    height: scaleSizeH(4),
    borderRadius: scaleSizeH(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  itemStatus: {
    fontSize: scaleSizeW(12),
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSizeW(8),
  },
  actionBtn: {
    padding: scaleSizeW(8),
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeH(15),
  },
  emptyText: {
    fontSize: scaleSizeW(16),
  },
})

