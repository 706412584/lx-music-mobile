import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { SearchBar, Operations, Sheets } from '@/components/home'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useHorizontalMode } from '@/utils/hooks'

/**
 * 主页主体内容组件
 * 整合搜索栏、快捷入口和歌单列表
 * 参考 MusicFree 的设计
 * 支持横竖屏自适应布局
 */
const HomeBody = memo(() => {
  const isHorizontal = useHorizontalMode()

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBarContainer}>
        <SearchBar />
      </View>

      {/* 横屏模式：左右布局；竖屏模式：上下布局 */}
      <View style={[styles.contentContainer, isHorizontal && styles.horizontalLayout]}>
        {/* 快捷入口 */}
        <Operations isHorizontal={isHorizontal} />

        {/* 歌单列表（包含标签页） */}
        <View style={styles.sheetsContainer}>
          <Sheets />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(8),
  },
  contentContainer: {
    flex: 1,
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  sheetsContainer: {
    flex: 1,
  },
})

export default HomeBody
