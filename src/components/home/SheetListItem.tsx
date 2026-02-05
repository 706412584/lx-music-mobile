import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { getListMusics } from '@/core/list'
import { registerSongCountCacheClearer } from '@/utils/performanceOptimization'

interface SheetListItemProps {
  item: LX.List.MyListInfo
  onPress: (item: LX.List.MyListInfo) => void
  onDelete?: (item: LX.List.MyListInfo) => void
  showDeleteButton?: boolean
}

// 缓存歌曲数量，避免重复获取
const songCountCache = new Map<string, number>()

// 注册缓存清理函数
registerSongCountCacheClearer(() => {
  songCountCache.clear()
})

// 导出缓存清理函数供外部使用
export const clearSongCountCache = () => {
  songCountCache.clear()
}

/**
 * 歌单列表项组件
 * 显示歌单封面、名称、歌曲数量和删除按钮
 *
 * 性能优化：
 * - 使用缓存避免重复获取歌曲数量
 * - 使用 memo 避免不必要的重渲染
 * - 使用 useMemo 缓存计算结果
 */
const SheetListItem = memo(({ item, onPress, onDelete, showDeleteButton = true }: SheetListItemProps) => {
  const theme = useTheme()
  const deleteButtonRef = useRef<TouchableOpacity>(null)
  const [songCount, setSongCount] = useState(() => songCountCache.get(item.id) ?? 0)

  useEffect(() => {
    // 如果缓存中已有数据，直接使用
    const cached = songCountCache.get(item.id)
    if (cached !== undefined) {
      setSongCount(cached)
      return
    }

    // 获取歌曲数量
    let cancelled = false
    void getListMusics(item.id).then((musics) => {
      if (!cancelled) {
        const count = musics.length
        setSongCount(count)
        songCountCache.set(item.id, count)
      }
    }).catch(() => {
      if (!cancelled) {
        setSongCount(0)
        songCountCache.set(item.id, 0)
      }
    })

    return () => {
      cancelled = true
    }
  }, [item.id])

  const handlePress = () => {
    onPress(item)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item)
    }
  }

  // 使用 useMemo 缓存样式对象，避免每次渲染都创建新对象
  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: theme['c-content-background'] },
  ], [theme])

  const coverMaskStyle = useMemo(() => [
    styles.coverMask,
    { backgroundColor: theme['c-primary-alpha-200'] },
  ], [theme])

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* 歌单封面 */}
        <View style={styles.coverContainer}>
          <Image
            source={
              item.img
                ? { uri: item.img }
                : require('@/resources/images/album-default.jpeg')
            }
            style={styles.cover}
          />
        </View>

        {/* 歌单信息 */}
        <View style={styles.info}>
          <Text
            numberOfLines={1}
            size={15}
            style={styles.title}
            color={theme['c-font']}
          >
            {item.name}
          </Text>
          <Text
            numberOfLines={1}
            size={12}
            color={theme['c-font-label']}
            style={styles.description}
          >
            {songCount} 首歌曲
          </Text>
        </View>

        {/* 删除按钮 */}
        {showDeleteButton && (
          <TouchableOpacity
            ref={deleteButtonRef}
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="remove" size={20} color={theme['c-font-label']} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scaleSizeW(12),
    marginVertical: scaleSizeH(6),
    borderRadius: scaleSizeW(8),
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleSizeW(12),
  },
  coverContainer: {
    width: scaleSizeW(56),
    height: scaleSizeW(56),
    borderRadius: scaleSizeW(6),
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSizeW(8),
  },
  coverMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: scaleSizeW(12),
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500',
    marginBottom: scaleSizeH(4),
  },
  description: {
    fontWeight: '400',
  },
  deleteButton: {
    padding: scaleSizeW(8),
    marginLeft: scaleSizeW(8),
  },
})

export default SheetListItem
