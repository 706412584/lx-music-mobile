import { memo, useCallback, useState, useRef } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Text as RNText } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { toast } from '@/utils/tools'
import { buildLocalMusicInfo, buildLocalMusicInfoByFilePath } from '@/screens/Home/Views/Mylist/MyList/listAction'
import { readMetadata, scanAudioFiles } from '@/utils/localMediaMetadata'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import ChoosePath from '@/components/common/ChoosePath'

/**
 * 本地音乐页面
 */
const LocalMusic = memo(({ onBack }: { onBack?: () => void }) => {
  const theme = useTheme()
  const t = useI18n()
  const [musicList, setMusicList] = useState<LX.Music.MusicInfoLocal[]>([])
  const [loading, setLoading] = useState(false)
  const choosePathRef = useRef<any>(null)

  const handleSelectFiles = useCallback(async () => {
    choosePathRef.current?.show({
      title: t('local_music_select_folder'),
      dirOnly: true,
    })
  }, [t])

  const handlePathSelected = useCallback(async (path: string) => {
    try {
      setLoading(true)
      toast(t('local_music_scanning'))

      // 扫描音频文件
      const files = await scanAudioFiles(path)

      if (!files || files.length === 0) {
        toast(t('local_music_no_files'))
        setLoading(false)
        return
      }

      toast(t('local_music_loading', { count: files.length }))

      // 读取文件元数据
      const musicInfos: LX.Music.MusicInfoLocal[] = []
      for (const file of files) {
        try {
          const metadata = await readMetadata(file.path)
          if (metadata) {
            musicInfos.push(buildLocalMusicInfo(file.path, metadata))
          } else {
            musicInfos.push(buildLocalMusicInfoByFilePath(file))
          }
        } catch (error) {
          console.error('Read metadata error:', error)
          musicInfos.push(buildLocalMusicInfoByFilePath(file))
        }
      }

      setMusicList(prev => [...prev, ...musicInfos])
      toast(t('local_music_loaded', { count: musicInfos.length }))
    } catch (error) {
      console.error('Select files error:', error)
      toast(t('local_music_load_error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handlePlay = useCallback(async (index: number) => {
    try {
      await setTempList('local_music', musicList)
      await playList(LIST_IDS.TEMP, index)
    } catch (error) {
      console.error('Play local music error:', error)
      toast(t('play_error'))
    }
  }, [musicList, t])

  const handleClearAll = useCallback(() => {
    Alert.alert(
      t('confirm'),
      t('local_music_clear_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            setMusicList([])
            toast(t('local_music_cleared'))
          },
        },
      ],
    )
  }, [t])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfoLocal; index: number }) => {
    const imgUrl = item.meta?.picUrl

    return (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: theme['c-primary-alpha-100'] }]}
        onPress={() => handlePlay(index)}
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
            {item.name}
          </RNText>
          <RNText
            style={[styles.singer, { color: theme['c-font-label'] }]}
            numberOfLines={1}
          >
            {item.singer}
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
      <Icon name="add_folder" size={64} color={theme['c-font-label']} />
      <RNText style={[styles.emptyText, { color: theme['c-font-label'] }]}>
        {t('local_music_empty')}
      </RNText>
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: theme['c-button-font'] }]}
        onPress={handleSelectFiles}
        activeOpacity={0.7}
        disabled={loading}
      >
        <Icon name="add_folder" size={20} color="#FFFFFF" />
        <RNText style={styles.addBtnText}>
          {loading ? t('loading') : t('local_music_add')}
        </RNText>
      </TouchableOpacity>
    </View>
  ), [theme, t, handleSelectFiles, loading])

  return (
    <View style={[styles.container, { backgroundColor: theme['c-primary-alpha-50'] }]}>
      {/* 头部 - 只在有音乐时显示 */}
      {musicList.length > 0 && (
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
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme['c-button-font'] }]}
              onPress={handleSelectFiles}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Icon name="add_folder" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme['c-button-font'], marginLeft: scaleSizeW(8) }]}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Icon name="remove" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 列表 */}
      <FlatList
        data={musicList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={musicList.length === 0 ? styles.emptyList : styles.list}
      />

      {/* 文件夹选择器 */}
      <ChoosePath
        ref={choosePathRef}
        onConfirm={handlePathSelected}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerBtn: {
    width: scaleSizeW(36),
    height: scaleSizeW(36),
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: scaleSizeH(24),
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSizeW(24),
    paddingVertical: scaleSizeH(12),
    borderRadius: 24,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: scaleSizeW(8),
  },
})

export default LocalMusic
