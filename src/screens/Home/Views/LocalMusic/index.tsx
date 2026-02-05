import { memo, useCallback, useState, useRef, useEffect } from 'react'
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, BackHandler } from 'react-native'
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
import { getData, saveData } from '@/plugins/storage'

const LOCAL_MUSIC_STORAGE_KEY = 'local_music_list'
const LOCAL_MUSIC_PATHS_KEY = 'local_music_paths'

/**
 * 本地音乐页面
 */
const LocalMusic = memo(({ onBack }: { onBack?: () => void }) => {
  const theme = useTheme()
  const t = useI18n()
  const [musicList, setMusicList] = useState<LX.Music.MusicInfoLocal[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const choosePathRef = useRef<any>(null)

  // 加载本地音乐列表和已选择的目录
  useEffect(() => {
    const loadLocalMusic = async () => {
      try {
        const savedList = await getData<LX.Music.MusicInfoLocal[]>(LOCAL_MUSIC_STORAGE_KEY)
        if (savedList && Array.isArray(savedList)) {
          setMusicList(savedList)
        }
        
        const savedPaths = await getData<string[]>(LOCAL_MUSIC_PATHS_KEY)
        if (savedPaths && Array.isArray(savedPaths)) {
          setSelectedPaths(savedPaths)
        }
      } catch (error) {
        console.error('Load local music error:', error)
      }
    }
    void loadLocalMusic()
  }, [])

  // 监听硬件返回键
  useEffect(() => {
    if (!onBack) return

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack()
      return true // 阻止默认行为
    })

    return () => backHandler.remove()
  }, [onBack])

  // 保存本地音乐列表
  const saveMusicList = useCallback(async (list: LX.Music.MusicInfoLocal[]) => {
    try {
      await saveData(LOCAL_MUSIC_STORAGE_KEY, list)
    } catch (error) {
      console.error('Save local music error:', error)
    }
  }, [])

  // 保存已选择的目录
  const saveSelectedPaths = useCallback(async (paths: string[]) => {
    try {
      await saveData(LOCAL_MUSIC_PATHS_KEY, paths)
    } catch (error) {
      console.error('Save paths error:', error)
    }
  }, [])

  // 扫描指定目录的音乐文件
  const scanMusicFromPath = useCallback(async (path: string) => {
    try {
      // 扫描音频文件
      const files = await scanAudioFiles(path)

      if (!files || files.length === 0) {
        return []
      }

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

      return musicInfos
    } catch (error) {
      console.error('Scan music error:', error)
      return []
    }
  }, [])

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

      const musicInfos = await scanMusicFromPath(path)

      if (musicInfos.length === 0) {
        toast(t('local_music_no_files'))
        setLoading(false)
        return
      }

      toast(t('local_music_loading', { count: musicInfos.length }))

      // 添加到已选择的目录列表（去重）
      const newPaths = selectedPaths.includes(path) ? selectedPaths : [...selectedPaths, path]
      setSelectedPaths(newPaths)
      await saveSelectedPaths(newPaths)

      const newList = [...musicList, ...musicInfos]
      setMusicList(newList)
      await saveMusicList(newList)
      toast(t('local_music_loaded', { count: musicInfos.length }))
    } catch (error) {
      console.error('Select files error:', error)
      toast(t('local_music_load_error'))
    } finally {
      setLoading(false)
    }
  }, [t, musicList, selectedPaths, saveMusicList, saveSelectedPaths, scanMusicFromPath])

  // 刷新所有已选择的目录
  const handleRefresh = useCallback(async () => {
    if (selectedPaths.length === 0) {
      toast(t('local_music_no_paths'))
      return
    }

    try {
      setLoading(true)
      toast(t('local_music_refreshing'))

      let allMusicInfos: LX.Music.MusicInfoLocal[] = []
      
      for (const path of selectedPaths) {
        const musicInfos = await scanMusicFromPath(path)
        allMusicInfos = [...allMusicInfos, ...musicInfos]
      }

      setMusicList(allMusicInfos)
      await saveMusicList(allMusicInfos)
      toast(t('local_music_refreshed', { count: allMusicInfos.length }))
    } catch (error) {
      console.error('Refresh error:', error)
      toast(t('local_music_refresh_error'))
    } finally {
      setLoading(false)
    }
  }, [selectedPaths, t, saveMusicList, scanMusicFromPath])

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
          onPress: async () => {
            setMusicList([])
            setSelectedPaths([])
            await saveMusicList([])
            await saveSelectedPaths([])
            toast(t('local_music_cleared'))
          },
        },
      ],
    )
  }, [t, saveMusicList, saveSelectedPaths])

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
      {/* 头部 - 始终显示 */}
      {onBack && (
        <View style={[styles.header, { backgroundColor: theme['c-primary-alpha-600'] }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Icon name="chevron-left" size={24} color={theme['c-font']} />
          </TouchableOpacity>
          {musicList.length > 0 && (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: theme['c-button-font'] }]}
                onPress={handleRefresh}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Icon name="single-loop" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: theme['c-button-font'], marginLeft: scaleSizeW(8) }]}
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
          )}
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
