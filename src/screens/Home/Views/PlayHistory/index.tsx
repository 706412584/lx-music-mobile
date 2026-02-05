import { memo, useCallback, useEffect, useState } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { Text as RNText } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import playerState from '@/store/player/state'
import { playList } from '@/core/player/player'
import { setTempList } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'

/**
 * 播放历史页面
 */
const PlayHistory = memo(({ onBack }: { onBack?: () => void }) => {
  const theme = useTheme()
  const t = useI18n()
  const [historyList, setHistoryList] = useState<LX.Player.PlayMusicInfo[]>([...playerState.playedList])

  useEffect(() => {
    const handleUpdate = () => {
      setHistoryList([...playerState.playedList])
    }
    
    global.state_event.on('playPlayedListChanged', handleUpdate)
    return () => {
      global.state_event.off('playPlayedListChanged', handleUpdate)
    }
  }, [])

  const handlePlay = useCallback(async (item: LX.Player.PlayMusicInfo, index: number) => {
    try {
      // 将历史记录添加到临时列表并播放
      const musicList = historyList.map(h => h.musicInfo)
      await setTempList('play_history', musicList)
      await playList(LIST_IDS.TEMP, index)
    } catch (error) {
      console.error('Play history item error:', error)
      toast(t('play_error'))
    }
  }, [historyList, t])

  const handleClearAll = useCallback(() => {
    playerState.playedList = []
    setHistoryList([])
    global.state_event.emit('playPlayedListChanged', [])
    toast(t('play_history_cleared'))
  }, [t])

  const renderItem = useCallback(({ item, index }: { item: LX.Player.PlayMusicInfo; index: number }) => {
    const musicInfo = item.musicInfo
    const imgUrl = 'meta' in musicInfo ? musicInfo.meta?.picUrl : musicInfo.img

    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: theme['c-primary-alpha-100'] }]}
        onPress={() => handlePlay(item, index)}
        activeOpacity={0.7}
      >
        <Image
          url={imgUrl}
          style={styles.cover}
        />
        <View style={styles.info}>
          <RNText
            style={[styles.name, { color: theme['c-font'] }]}
            numberOfLines={1}
          >
            {musicInfo.name}
          </RNText>
          <RNText
            style={[styles.singer, { color: theme['c-font-label'] }]}
            numberOfLines={1}
          >
            {musicInfo.singer}
          </RNText>
        </View>
        <Icon
          name="play-outline"
          size={24}
          color={theme['c-primary-font']}
          style={styles.playIcon}
        />
      </TouchableOpacity>
    )
  }, [theme, handlePlay])

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon name="music_time" size={64} color={theme['c-font-label']} />
      <RNText style={[styles.emptyText, { color: theme['c-font-label'] }]}>
        {t('play_history_empty')}
      </RNText>
    </View>
  ), [theme, t])

  return (
    <View style={[styles.container, { backgroundColor: theme['c-primary-alpha-50'] }]}>
      {/* 头部 - 只在有历史记录时显示 */}
      {historyList.length > 0 && (
        <View style={[styles.header, { backgroundColor: theme['c-primary-alpha-600'] }]}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={24} color={theme['c-font']} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: theme['c-button-font'] }]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <RNText style={[styles.clearBtnText, { color: '#FFFFFF' }]}>
              {t('clear_all')}
            </RNText>
          </TouchableOpacity>
        </View>
      )}

      {/* 列表 */}
      <FlatList
        data={historyList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.musicInfo.id}_${index}`}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={historyList.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(12),
  },
  backBtn: {
    marginRight: 'auto',
  },
  clearBtn: {
    paddingHorizontal: scaleSizeW(16),
    paddingVertical: scaleSizeH(6),
    borderRadius: 16,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: scaleSizeW(12),
    paddingTop: scaleSizeH(8),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(12),
    paddingVertical: scaleSizeH(8),
    marginBottom: scaleSizeH(8),
    borderRadius: 8,
  },
  cover: {
    width: scaleSizeW(50),
    height: scaleSizeW(50),
    borderRadius: 4,
  },
  info: {
    flex: 1,
    marginLeft: scaleSizeW(12),
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: scaleSizeH(4),
  },
  singer: {
    fontSize: 13,
  },
  playIcon: {
    marginLeft: scaleSizeW(8),
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: scaleSizeH(16),
  },
})

export default PlayHistory
